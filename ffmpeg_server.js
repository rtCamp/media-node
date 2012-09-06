var formidable = require('formidable'),
	http = require('http'),
	connect = require('connect'),
	util = require('util'),
	exec = require('child_process').exec;
var queue = new Array(),
	completed = new Array(),
	current = new Array();
var processing = 0;
var max_processing = 2;
var queued_folder = './queued/';
var temp_folder = './temp/';
var completed_folder = './completed/';
var transcoder_port = 911;
var public_port = 912;

http.createServer(function(req, res) {
	if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			res.writeHead(200, {'content-type': 'text/plain'});
			res.write('received upload:\n\n');
			if(files.upload.name){
				console.log('file '+files.upload.name + ' uploaded');
				exec('mv '+ files.upload.path + ' ' + queued_folder + files.upload.name, function (error,stdout,stderr){
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						console.log('exec error: ' + error);
					}
					else{
						console.log(files.upload.name + ' added to the queue');
						queue.push(files.upload.name);
						console.log(queue);
						queueHandler();
					}
				} );
			}
			
			res.end(files.upload.name + ' added to the queue');
			//res.end(util.inspect({fields: fields, files: files}));
		});
		
		return;
	}
	if (req.url == '/status'||req.url == '/status/'){
		res.writeHead(200, {'content-type': 'text/plain'});
		res.write('\n\nRemaining Queue \n\n'+util.inspect(queue));
		res.write('\n\nCurrently Processing \n\n'+util.inspect(current));
		res.write('\n\nCompleted \n\n'+util.inspect(completed));
		res.write('\n\nProcessors allocated: \n\n' + processing );
		res.write('\n\nMax Processors: \n\n' + max_processing);
		res.end();
		return;
	}
	res.writeHead(200, {'content-type': 'text/html'});
	res.end(
		'<form action="/upload" enctype="multipart/form-data" method="post">'+
		'<input type="text" name="title"><br>'+
		'<input type="file" name="upload" multiple="multiple"><br>'+
		'<input type="submit" value="Upload">'+
		'</form>'
	);
}).listen(transcoder_port);
function queueHandler() {
	if(processing >= max_processing ){
		console.log('max processors already allocated');
		return true;
	}
	console.log('processing queue');
	var current_video = queue.shift();
	if(current_video){
		processing++;
		console.log('Processing '+ current_video);
		var filename = current_video.split(".");
		if (filename.length>1) {
			var extension = filename.pop();
			filename = filename.join('.');
		}
		else {
			var extension = '';
			filename = filename[0];
		}
		var command = 'ffmpeg -i ' + queued_folder + current_video + ' -t 00:00:10.00 -r 24 -vcodec libx264 -vprofile high -preset veryslow -vf scale=640:480 -b:v 1500k -maxrate 100k -bufsize 200k -threads 1 -acodec libfaac -b:a 128k ' + temp_folder + filename + '.mp4';
		console.log(command);
		current.push(current_video);
		var child = exec(command,function(error,stdout,stderr){
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
			}else{
				exec('mv ' + temp_folder + filename + '.mp4 ' + completed_folder + filename+'.mp4', function (error,stdout,stderr){
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						console.log('exec error: ' + error);
					}
					else{
						console.log('Successful encoding');
					}
				} );
			}
			completed.push(current_video);
			current.splice(current.indexOf(current_video),1);
			processing--;
			queueHandler();
		});
	}
}
connect()
	.use(connect.static(completed_folder))
	.use(function(req,res){
		res.writeHead(404, {"content-type": "text/html"});
		res.end('The URL you are looking for is DEAD');
	}).listen(public_port);