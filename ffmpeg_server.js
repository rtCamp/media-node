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
var version = '2.0'; //version
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
    fs.exists(foldername, function (exists) {
        if(!exists){
            fs.mkdirSync(foldername);
        }
    });
}

checkAndCreateDirectory(queued_folder);
checkAndCreateDirectory(temp_folder);
checkAndCreateDirectory(completed_folder);

/**
 * If the server is terminated when the files are still in queue or being converted, 
 * this function re-queues those files at the startup.
 * */
function reQueueFiles(){
	db.each('SELECT * FROM transactions WHERE status = 1 OR status = 2',function(err,row){
        if(typeof row === 'undefined'){ return false;}
		var vid={};
		vid.id = row.transaction_id;
		vid.filename = row.original_file;
		vid.status = 1;
		vid.output_type = row.output_type;
		queue.push(vid);
	});
}
reQueueFiles();

console.log('Starting FFMPEG Server on '+transcoder_ip+':'+transcoder_port);
function queueHandler() {
    if(processing >= max_processing ){
        console.log('Max Processors already allocated');
        return true;
    }
    
    console.log('Processing Queue');
    
    var current_file = queue.shift();
    
    if(current_file){
        
        processing++;
        var error = 0;
        
        if(typeof(current_file.callback_url)===undefined){
            console.log('=======================================');
            console.log('= Error : Callback URL is not defined =');
            console.log('=======================================');
            error = 1;
        }
        
        if(typeof(current_file.output_type)===undefined){
            console.log('======================================');
            console.log('= Error : Output type is not defined =');
            console.log('======================================');
            error = 1;
        }
        
        if(typeof(current_file.id)===undefined){
            console.log('===================================');
            console.log('= Error : Media ID is not defined =');
            console.log('===================================');
            error = 1;
        }
        
        if(typeof(current_file.filename)===undefined){
            console.log('===================================');
            console.log('= Error : Filename is not defined =');
            console.log('===================================');
            error = 1;
        }
        
        if ( error ) {
            return;
        }
        
        console.log('Filename : ' + current_file.filename );
        
        var filename = current_file.filename.split(".");
        console.log('File info : ' + filename);

        var filename_ext_index = current_file.filename.lastIndexOf(".");
        var basename = current_file.filename.substring( 0, filename_ext_index );
        console.log('Filename without extension : '+basename);
        
        if (filename.length>1) {
            filename = current_file.filename;
        }
        
        if(current_file.output_type == 1){
            console.log('Duration : '+current_file.duration);
            console.log('Max Thumbnails to create : '+current_file.thumbs);
        }
        
        console.log('Processing ==> '+ current_file.filename);
        
        if(current_file.output_type == 1){
            filename = basename + '.mp4';
            var command = 'ffmpeg -i ' + queued_folder + current_file.filename + ' -loglevel quiet -r 24 -vcodec libx264 -vprofile high -preset slow -vf scale=640:480 -b:v 1500k -maxrate 100k -bufsize 200k -pix_fmt yuv420p -threads 1 -acodec libfaac -b:a 128k "' + temp_folder + filename + '"';
            var commands = new Array();
            var thumbs = new Array();
            var interval;
            //http://odino.org/ffmpeg-get-a-thumbnail-from-a-video-with-php/
            if ( current_file.duration >= current_file.thumbs ) {
                interval = current_file.duration/current_file.thumbs;
                for(var i=0; i<current_file.thumbs; i++ ){
                    thumbs[i] = basename + i + '.jpg';
                    commands[i] = 'ffmpeg -i ' + queued_folder + current_file.filename + ' -loglevel quiet -filter:v yadif -an -ss ' + (interval*i+1*1) + ' -t 00:00:01 -r 1 -vframes 1 -y -vcodec mjpeg -f mjpeg "' + temp_folder + thumbs[i] +'" 2>&1';
                }
            } else {
                interval = current_file.duration/2;
                thumbs[0] = basename + '0.jpg';
                commands[0] = 'ffmpeg -i ' + queued_folder + current_file.filename + ' -loglevel quiet -filter:v yadif -an -ss 1 -t 00:00:01 -r ' + interval + ' -y -vcodec mjpeg -f mjpeg "' + temp_folder + thumbs[0] + '" 2>&1';
            }
        //var thumb = 'ffmpeg  -itsoffset -4  -i ' + queued_folder + current_file.filename + ' -vcodec mjpeg -vframes 1 -an -f rawvideo -s 320x240 ' + temp_folder + thumbname;
        }
        else if(current_file.output_type == 2){
            filename = basename + '.mp3';
            var command = 'ffmpeg -i ' + queued_folder + current_file.filename + ' -loglevel quiet  "' + temp_folder + filename + '"';
        }
        else{
            console.log('=================================');
            console.log('= Error : Output type not valid =');
            console.log('=================================');
            return;
        }
			
        current_file = update_transaction_status(current_file,2);
        console.log(command);
        current.push(current_file);
        exec(command,function(error,stdout,stderr){
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('Execution error: ' + error);
                current_file = update_transaction_status(current_file,4);
            }else{
                exec('mv "' + temp_folder + filename + '" "' + completed_folder + filename+'"', function (error,stdout,stderr){
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('Execution error: ' + error);
                        current_file = update_transaction_status(current_file,7);
                        var output = {};
                        output['file_id'] = current_file.id;
                        output['status'] = 7;
                        send_callback(current_file.callback_url,output);
                    } else {
                        console.log('==================================')
                        console.log('= Success : Encoding Successfull =');
                        console.log('==================================')
                        current_file = update_transaction_status(current_file,3);
                        var output = {};
                        output['file_id'] = current_file.id;
                        output['file_url'] = 'http://' + transcoder_ip + ':' + transcoder_port + '/' + filename;
                        output['status'] = 3;
                        output['file_name'] = filename;
                        console.log(output);
                        completed.push(current_file);
                        
                        if(current_file.output_type == 1){
                            generate_thumbs(commands,thumbs,0,current_file.thumbs,current_file.callback_url,output);
                        } else {
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
    db.run("CREATE TABLE IF NOT EXISTS transactions (transaction_id INTEGER PRIMARY KEY AUTOINCREMENT, creation_date INTEGER, original_file TEXT, status INT, output_type INT, transcoded_file TEXT, callback_url TEXT, duration INT NULL DEFAULT NULL, thumbs INT NULL DEFAULT NULL)");
    db_run_error_handler('ALTER TABLE transactions ADD COLUMN duration INT NULL;');
    db_run_error_handler('ALTER TABLE transactions ADD COLUMN thumbs INT NULL;');
});

//Prevent server from crashing due to errors
process.on('uncaughtException', function(err) {
    console.error(err.stack);
});


function db_run_error_handler(command){
    try {
        db.run(command,function(error) {
            if(error) {
                throw error;
            }
        }
        );
    } catch(err) {
        dumpError(err);
    }
}

function dumpError(err) {
    if (typeof err === 'object') {
        if (err.message) {
            console.log('\nMessage: ' + err.message)
        }
        if (err.stack) {
            console.log('\nStacktrace:')
            console.log('====================')
            console.log(err.stack);
        }
    } else {
        console.log('dumpError :: argument is not an object');
    }
}

function update_transaction_status(vid,status){
    vid.status = status;
    var stmt = db.prepare("UPDATE transactions SET status = ? WHERE transaction_id = ?");
    stmt.run(status,vid.id);
    return vid;
}

function generate_thumbs(commands, thumbs, start, end, callback_url, output){
    if ( start !== undefined ) {
        if ( (start < end) && (start in commands) ) {
            var next = start;
            console.log(commands[start]);
            exec(commands[start],function(error,stdout,stderr){
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    console.log('Execution error: ' + error);
                    console.log('Thumbnail '+(start*1+1)+' could not be created');
                    next = start+1;
                    if ( (next < end) && (next in commands) ) {
                        generate_thumbs(commands, thumbs, next, end, callback_url, output);
                    } else {
                        send_callback(callback_url,output);
                    }
                }
                else{
                    console.log('Thumbnail '+(start*1+1)+' Created Successfully');
                    exec('mv "' + temp_folder + thumbs[start] + '" "' + completed_folder + thumbs[start]+'"', function (error,stdout,stderr){
                        console.log('stdout: ' + stdout);
                        console.log('stderr: ' + stderr);
                        if (error !== null) {
                            console.log('Execution error: ' + error);
                        }
                    });
                    next = start+1;
                    output['thumb_'+next] = 'http://' + transcoder_ip + ':' + transcoder_port + '/' + thumbs[start];
                    console.log(output);
                    if ( (next < end) && (next in commands) ) {
                        generate_thumbs(commands, thumbs, next, end, callback_url, output);
                    } else {
                        send_callback(callback_url,output);
                    }
                }
            });
        }
    } else {
        console.log('==================================================');
        console.log('= Error : Start not defined in generate_thumbs() =');
        console.log('==================================================');
    }
    
}

function insert_transaction(filename,status,output_type,callback_url,res,duration,thumbs){
    var vid = new Object;
    db.serialize(function() {
        if(typeof callback_url !== undefined){
            if(output_type == 1) {
                var stmt = db.prepare("INSERT INTO transactions (creation_date,output_type,original_file,status,callback_url,duration,thumbs) VALUES (strftime('%s','now'),?,?,?,?,?,?)");
            } else {
                var stmt = db.prepare("INSERT INTO transactions (creation_date,output_type,original_file,status,callback_url) VALUES (strftime('%s','now'),?,?,?,?)");
            }
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
            if(typeof row.last_id !== undefined){
                if(status == 0){
					
                    vid.id = row.last_id;
                    vid.filename = filename;
                    vid.status = status;
                    vid.output_type = output_type;
                    if( output_type == 1 ) {
                        vid.duration = duration;
                        vid.thumbs = thumbs;
                    }
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
                res.writeHead(200, {
                    'content-type': 'text/plain'
                });
                if(typeof(files.upload)==undefined){
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
                            console.log('Execution error: ' + error);
                            insert_transaction(newname+'.'+ext,6,output_type,res,parseInt(fields.duration),parseInt(fields.thumbs));
                        }
                        else{
                            console.log(queued_folder + newname + '.' + ext + ' added to the queue');
                            console.log(queue);
                            if(typeof(fields.callback_url)!==undefined){
                                insert_transaction(newname+'.'+ext,0,output_type,fields.callback_url,res, parseInt(fields.duration),parseInt(fields.thumbs));
                            }
                            else{
                                insert_transaction(newname+'.'+ext,0,output_type,res, fields.duration,fields.thumbs);
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
            res.writeHead(200, {
                'content-type': 'text/plain'
            });
            res.write('\n\nRemaining Queue \n\n'+util.inspect(queue));
            res.write('\n\nCurrently Processing \n\n'+util.inspect(current));
            res.write('\n\nCompleted \n\n'+util.inspect(completed));
            res.write('\n\nCurrent Parallel Processes: \n\n' + processing );
            res.write('\n\nMax Parallel Processes: \n\n' + max_processing);
            res.end();
            return;
        }
        
        /**
         * This block is to show the version of media node installed
         **/
        if (req.url == '/version'||req.url == '/version/'){
            res.writeHead(200, {
                'content-type': 'text/plain'
            });
            res.write(version);
            res.end();
            return;
        }
		
        /**
         * This block will show the upload form with callback url to be opened when the transcoding is complete
         **/
        if(req.url == '/' ){
            res.writeHead(200, {
                'content-type': 'text/html'
            });
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
        res.writeHead(404, {
            "content-type": "text/html"
        });
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

//To start the queue handler after the server is started(just in case there are some earlier queued files)
setTimeout(function(){queueHandler();},5000);