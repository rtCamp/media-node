var formidable = require('formidable'),//For form handling
	http = require('http'), //For creating http server required by connect framework
	connect = require('connect'), //For creating the server for serving static files as well as status of the server
	util = require('util'), //Inspecting elements for debugging and showing server status
	fs = require('fs'), //For moving files around and handling uploads
	sqlite3 = require('sqlite3').verbose(), //For storing the current state of the server(files in queue and currently processing and the files encoded)
	db = new sqlite3.Database('./db.sqlite'), //Open a database named db.sqlite or create it if not exist
	url = require('url'), //For parsing the request url
	exec = require('child_process').exec; //For calling the ffmpeg command and tracking its execution
var queue = new Array(),
	completed = new Array(),
	current = new Array();
var processing = 0;
var max_processing = 1;
var queued_folder = './queued/';
var temp_folder = './temp/';
var completed_folder = './completed/';
var transcoder_port = 1203;
var transcoder_ip = '127.0.0.1'; //This will allow the transcoding server to run locally only
var server_args = process.argv.slice(2);
for (arg in server_args){
	switch(server_args[arg]){
		case 'port'	:
			if(server_args[parseInt(arg)+1]!==undefined){
				var port_temp = parseInt(server_args[parseInt(arg)+1]);
				if(!isNaN(port_temp)){
					transcoder_port = port_temp;
				}
			}
			break;
		case 'ip'	:
			if(server_args[parseInt(arg)+1]!==undefined){
				var ip_temp = server_args[parseInt(arg)+1];
				if(ip_temp.match('^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$')){
					transcoder_ip = ip_temp;
				}
			}
			break;
		case 'parallel'	:
			if(server_args[parseInt(arg)+1]!==undefined){
				var parallel_temp = parseInt(server_args[parseInt(arg)+1]);
				if(!isNaN(parallel_temp)){
					max_processing = parallel_temp;
				}
			}
			break;
	}
}

function checkAndCreateDirectory(foldername){
	fs.existsSync(foldername, function (exists) {
		if(!exists){
			fs.mkdirSync(foldername);
		}
	});
}

checkAndCreateDirectory(queued_folder);
checkAndCreateDirectory(temp_folder);
checkAndCreateDirectory(completed_folder);

console.log('Starting FFMPEG Server on '+transcoder_ip+':'+transcoder_port);
function queueHandler() {
	if(processing >= max_processing ){
		console.log('max processors already allocated');
		return true;
	}
	console.log('processing queue');
	var current_file = queue.shift();
	if(current_file){
		processing++;
		console.log('Processing '+ current_file.filename);
		var filename = current_file.filename.split(".");
		if (filename.length>1) {
			var extension = filename.pop();
			filename = filename.join('.');
		}
		else {
			var extension = '';
			filename = filename[0];
		}
		if(current_file.output_type == 1){
			filename = filename + '.mp4';
			var command = 'ffmpeg -i ' + queued_folder + current_file.filename + ' -loglevel quiet -r 24 -vcodec libx264 -vprofile high -preset slow -vf scale=640:480 -b:v 1500k -maxrate 100k -bufsize 200k -threads 1 -acodec libfaac -b:a 128k "' + temp_folder + filename + '"';
		}
		else if(current_file.output_type == 2){
			filename = filename + '.mp3';
			var command = 'ffmpeg -i ' + queued_folder + current_file.filename + ' -loglevel quiet  "' + temp_folder + filename + '"';
		}
		else{
			console.log('Output type not valid');
			return;
		}
			
		current_file = update_transaction_status(current_file,2);
		console.log(command);
		current.push(current_file);
		var child = exec(command,function(error,stdout,stderr){
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
				current_file = update_transaction_status(current_file,4);
			}else{
				exec('mv "' + temp_folder + filename + '" "' + completed_folder + filename+'"', function (error,stdout,stderr){
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						console.log('exec error: ' + error);
						current_file = update_transaction_status(current_file,7);
						if(typeof(current_file.callback_url)!=='undefined'){
							var output = {};
							output['file_id'] = current_file.id;
							output['status'] = 7;
							send_callback(current_file.callback_url,output);
						}
					}
					else{
						console.log('Successful encoding');
						current_file = update_transaction_status(current_file,3);
						completed.push(current_file);
						if(typeof(current_file.callback_url)!=='undefined'){
							var output = {};
							output['file_id'] = current_file.id;
							output['file_url'] = 'http://' + transcoder_ip + ':' + transcoder_port + '/' + filename;
							output['status'] = 3;
							output['file_name'] = filename;
							send_callback(current_file.callback_url,output);
						}
					}
				});
			}
			current.splice(current.indexOf(current_file),1);
			processing--;
			queueHandler();
		});
	}
}

/**
 * Initializing the database table if not exist.
 * Status Codes:
 * 0:	File has been successfully recieved
 * 1:	File is in the queue
 * 2:	File is being transcoded
 * 3:	File is transcoded successfully and is ready for download
 * 4:	There was an error in transcoding
 * 5:	The file was removed by the server
 * 6:	There was an error in uploading
 * 7:	There was an error moving the transcoded file
 * 8:	The file type is not supported
 * 9:	The file was encoded but the callback failed
 * 
 * 
 * Output types:
 * 1:	Video(MP4 H.264 codec)
 * 2:	Audio(MP3)
 **/
db.serialize(function() {
	db.run("CREATE TABLE IF NOT EXISTS transactions (transaction_id INTEGER PRIMARY KEY, creation_date INTEGER, original_file TEXT, status INT, output_type INT, transcoded_file TEXT, callback_url TEXT )");
});

function update_transaction_status(vid,status){
	vid.status = status;
	var stmt = db.prepare("UPDATE transactions SET status = ? WHERE transaction_id = ?");
	stmt.run(status,vid.id);
	return vid;
}

function insert_transaction(filename,status,output_type,callback_url,res){
	callback_url = typeof callback_url !== 'undefined' ? callback_url : '';
	var vid = new Object;
	db.serialize(function() {
		if(typeof callback_url !== 'undefined'){
			var stmt = db.prepare("INSERT INTO transactions (creation_date,output_type,original_file,status,callback_url) VALUES (strftime('%s','now'),?,?,?,?)");
			stmt.run(output_type,filename,status,callback_url);
			vid.callback_url = callback_url;
		}
		else{
			var stmt = db.prepare("INSERT INTO transactions (creation_date,output_type,original_file,status) VALUES (strftime('%s','now'),?,?,?)");
			stmt.run(output_type,filename,status);
		}
		stmt.finalize();
		db.each('SELECT last_insert_rowid() as last_id',function(err,row){
			//console.log(row.last_id);
			if(typeof row.last_id !== 'undefined'){
				if(status == 0){
					
					vid.id = row.last_id;
					vid.filename = filename;
					vid.status = status;
					vid.output_type = output_type;
					vid = update_transaction_status(vid,1);
					queue.push(vid);
					var output = {};
					output['status_code'] = 0;
					output['file_id'] = vid.id;
					res.end(JSON.stringify(output));
					queueHandler();
				}
			}
			
		});
	});
}
connect()
	.use(connect.static(completed_folder))
	.use(function(req,res){
		var output = {};
		if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
			var form = new formidable.IncomingForm();
			form.parse(req, function(err, fields, files) {
				res.writeHead(200, {'content-type': 'text/plain'});
				if(typeof(files.upload)=='undefined'){
					console.log('Upload file not found in the request');
					output['error'] = 'Upload file not found';
					res.end(JSON.stringify(output));
					return;
				}
				output['status']='Recieved the file';
				if(files.upload.name){
					files.upload.name = files.upload.name.replace(/ /gi,'_');
					console.log('file '+files.upload.name + ' uploaded');
					var tempname = ((files.upload.name).split('.'));
					if(tempname.length>1)
						var ext = tempname.pop();
					else
						var ext = '';
					tempname = tempname.join('.');
					var newname = tempname;
					var counter = 1;
					while(fs.existsSync(queued_folder + newname + '.' + ext)){
						newname = tempname + counter.toString();
						counter++;
					}
					
					/**
					 * Moving the temp file to the queued folder
					 **/
					var command = 'mv '+ files.upload.path + ' ' + queued_folder + newname + '.' + ext;
					console.log(command);
					exec(command, function (error,stdout,stderr){
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						var output_type;
						switch(fields.media_type){
							case 'video'	:
								output_type = 1;
								break;
							case 'audio'	:
								output_type = 2;
								break;
							default :
								output_type = 1;						
						}
						if (error !== null) {
							console.log('exec error: ' + error);
							insert_transaction(newname+'.'+ext,6,output_type,res);
						}
						else{
							console.log(queued_folder + newname + '.' + ext + ' added to the queue');
							console.log(queue);
							if(typeof(fields.callback_url)!=='undefined'){
								insert_transaction(newname+'.'+ext,0,output_type,fields.callback_url,res);
							}
							else{
								insert_transaction(newname+'.'+ext,0,output_type,res);
							}
						}
					});
				}
			});
			return;
		}
		
		/**
		 * This block is to show the status of the queue on the frontend
		 **/
		if (req.url == '/status'||req.url == '/status/'){
			res.writeHead(200, {'content-type': 'text/plain'});
			res.write('\n\nRemaining Queue \n\n'+util.inspect(queue));
			res.write('\n\nCurrently Processing \n\n'+util.inspect(current));
			res.write('\n\nCompleted \n\n'+util.inspect(completed));
			res.write('\n\nCurrent Parallel Processes: \n\n' + processing );
			res.write('\n\nMax Parallel Processes: \n\n' + max_processing);
			res.end();
			return;
		}
		
		/**
		 * This block will show the upload form with callback url to be opened when the transcoding is complete
		 **/
		if(req.url == '/' ){
			res.writeHead(200, {'content-type': 'text/html'});
			res.end(
				'<form action="/upload" enctype="multipart/form-data" method="post">'+
				'<input type="text" name="callback_url"><br>'+
				'<input type="text" name="media_type"><br>'+
				'<input type="file" name="upload" multiple="multiple"><br>'+
				'<input type="submit" value="Upload">'+
				'</form>'
			);
			return;
		}
		
		/**
		 * Case when nothing matches gives 404 error message
		 **/
		res.writeHead(404, {"content-type": "text/html"});
		res.end('The URL you are looking for is DEAD');
	}).listen(transcoder_port,transcoder_ip,function(){
		console.log('Server Started');
	});
	
function send_callback(callback_url,output){
	var callback = url.parse(callback_url);
	var out_text = JSON.stringify(output);
	var data = 'response='+out_text;
	var options = {
		host: callback.hostname,
		port: callback.port,
		path: callback.path,
		method: 'POST',
		headers: {
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : data.length
		}
	};

	var req = http.request(options, function(res) {
		//console.log('STATUS: ' + res.statusCode);
		//console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('Servers reply on callback: ' + chunk);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	console.log(out_text);
	req.write(data);
	req.end();
}