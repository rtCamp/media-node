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
var max_processing = 4;
var queued_folder = './queued/';
var temp_folder = './temp/';
var completed_folder = './completed/';
var transcoder_port = 1203;
//var host_ip = '192.168.0.129'; //This will allow the transcoding server to run publicly
//var host_ip = '127.0.0.1'; //This will allow the transcoding server to run locally only
function queueHandler() {
	if(processing >= max_processing ){
		console.log('max processors already allocated');
		return true;
	}
	console.log('processing queue');
	var current_video = queue.shift();
	if(current_video){
		processing++;
		console.log('Processing '+ current_video.filename);
		var filename = current_video.filename.split(".");
		if (filename.length>1) {
			var extension = filename.pop();
			filename = filename.join('.');
		}
		else {
			var extension = '';
			filename = filename[0];
		}
		var command = 'ffmpeg -i ' + queued_folder + current_video.filename + ' -t 00:00:10.00 -r 24 -vcodec libx264 -vprofile high -preset fast -vf scale=640:480 -b:v 1500k -maxrate 100k -bufsize 200k -threads 1 -acodec libfaac -b:a 128k ' + temp_folder + filename + '.mp4';
		current_video = update_transaction_status(current_video,2);
		console.log(command);
		current.push(current_video);
		var child = exec(command,function(error,stdout,stderr){
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
				current_video = update_transaction_status(current_video,4);
			}else{
				exec('mv ' + temp_folder + filename + '.mp4 ' + completed_folder + filename+'.mp4', function (error,stdout,stderr){
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						console.log('exec error: ' + error);
						current_video = update_transaction_status(current_video,7);
					}
					else{
						console.log('Successful encoding');
						current_video = update_transaction_status(current_video,3);
						completed.push(current_video);
						if(typeof(current_video.callback_url)!=='undefined'){
							var callback = url.parse(current_video.callback_url);
							var options = {
								host: callback.hostname,
								port: callback.port,
								path: callback.path,
								method: 'POST'
							};
							var req = http.request(options, function(res) {
								console.log('STATUS: ' + res.statusCode);
								console.log('HEADERS: ' + JSON.stringify(res.headers));
								res.setEncoding('utf8');
								res.on('data', function (chunk) {
									console.log('BODY: ' + chunk);
								});
							});
							req.on('error', function(e) {
								console.log('problem with request: ' + e.message);
							});
							//@todo Add data to be passed
//							req.write('data\n');
//							req.write('data\n');
							req.end();
						}
					}
				});
			}
			current.splice(current.indexOf(current_video),1);
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
 **/
db.serialize(function() {
	db.run("CREATE TABLE IF NOT EXISTS transactions (transaction_id INTEGER PRIMARY KEY, creation_date INTEGER, original_file TEXT, status INT, transcoded_file TEXT, callback_url TEXT )");
});

function update_transaction_status(vid,status){
	vid.status = status;
	var stmt = db.prepare("UPDATE transactions SET status = ? WHERE transaction_id = ?");
	stmt.run(status,vid.id);
	return vid;
}

// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}

function insert_transaction(filename,status,callback_url){
	callback_url = typeof callback_url !== 'undefined' ? callback_url : '';
	var vid = new Object;
	db.serialize(function() {
		if(typeof callback_url !== 'undefined'){
			var stmt = db.prepare("INSERT INTO transactions (creation_date,original_file,status,callback_url) VALUES (strftime('%s','now'),?,?,?)");
			stmt.run(filename,status,callback_url);
			vid.callback_url = callback_url;
		}
		else{
			var stmt = db.prepare("INSERT INTO transactions (creation_date,original_file,status) VALUES (strftime('%s','now'),?,?)");
			stmt.run(filename,status);
		}
		stmt.finalize();
		db.each('SELECT last_insert_rowid() as last_id',function(err,row){
			//console.log(row.last_id);
			if(typeof row.last_id !== 'undefined'){
				if(status == 0){
					
					vid.id = row.last_id;
					vid.filename = filename;
					vid.status = status;
					vid = update_transaction_status(vid,1);
					queue.push(vid);
					queueHandler();
					console.log(util.inspect(queue));
				}
			}
			
		});
	});
}
connect()
	.use(connect.static(completed_folder))
	.use(function(req,res){
		if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
			var form = new formidable.IncomingForm();
			form.parse(req, function(err, fields, files) {
				res.writeHead(200, {'content-type': 'text/plain'});
				if(typeof(files.upload)=='undefined'){
					console.log('Upload file not found in the request');
					res.end('Upload file not found');
					return;
				}
				res.write('received upload:\n\n');
				if(files.upload.name){
					console.log('file '+files.upload.name + ' uploaded');
					var tempname = files.upload.name.split('.');
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
					exec('mv '+ files.upload.path + ' ' + queued_folder + newname + '.' + ext, function (error,stdout,stderr){
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						if (error !== null) {
							console.log('exec error: ' + error);
							insert_transaction(newname+'.'+ext,6);
							res.end(queued_folder + newname + '.' + ext + ' was not added to the queue');
						}
						else{
							console.log(queued_folder + newname + '.' + ext + ' added to the queue');
							console.log(queue);
							if(typeof(fields.callback_url)!=='undefined'){
								insert_transaction(newname+'.'+ext,0,fields.callback_url);
							}
							else{
								insert_transaction(newname+'.'+ext,0);
							}
							res.end( newname + '.' + ext + ' added to the queue');
						}
					});
				}
				//res.end(util.inspect({fields: fields, files: files}));
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
	}).listen(transcoder_port);