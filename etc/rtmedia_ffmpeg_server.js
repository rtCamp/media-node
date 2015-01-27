
console.log('Starting FFMPEG Server on ' + transcoder_ip + ':' + transcoder_port);

function ffmpegTime(timemark) {
    if (timemark == undefined)
        return 0;
    var parts = timemark.split(':');
    var secs = 0;
    if (parts.length < 3)
        return 0;
    // add hours
    secs += parseInt(parts[0], 10) * 3600;
    // add minutes
    secs += parseInt(parts[1], 10) * 60;

    // split sec/msec part
    var secParts = parts[2].split('.');

    // add seconds
    secs += parseInt(secParts[0], 10);

    return secs;
}

function start_encoding(current_file) {
    var result = execSync.exec("ffmpeg -y -i " + current_file.input_file_path);
    stdout = result.stdout + result.stderr;
    current_file.duration_time = /Duration: (([0-9]+):([0-9]{2}):([0-9]{2}).([0-9]+))/.exec(stdout) || '00:00:00.00';
    current_file.duration = ffmpegTime(current_file.duration_time[1]);
    if (current_file.duration_time.length > 0) {
        update_job_field(current_file.id, 'duration', current_file.duration_time[1]);
    } else {
        update_job_field(current_file.id, 'duration', "00:00:00.00");
    }
    current_file.filename = current_file.input_file_path.split("/").pop()
    var filename = current_file.filename.split(".");
    var basename = filename[0];
    if (filename.length > 1) {
        filename = current_file.filename;
    }

    if (current_file.request_formats == 'audio' || current_file.request_formats == "mp3") {
        current_file.output_type = 2
    } else if (current_file.request_formats == 'thumbnails' || current_file.request_formats == "thumbs") {
        current_file.output_type = 0
    } else {
        current_file.output_type = 1
    }


    if (current_file.output_type < 2) {
        console.log('Duration : ' + current_file.duration);
        console.log('Max Thumbnails to create : ' + current_file.thumbs);
    }

    console.log('Processing ==> ' + current_file.filename);
    if (current_file.thumbs == undefined) {
        current_file.thumbs = 8;
        console.log('Setting Thumbnails to create : ' + current_file.thumbs + ' as it was undefined');
    }
    if (current_file.output_type <= 1) {

        if (current_file.output_type == 1) {
            filename = basename + '.mp4';
            var command = 'ffmpeg -y -i "' + queued_folder + current_file.id + "/" + current_file.filename + '" -loglevel quiet -r 24 -vcodec libx264 -vprofile high -preset slow -vf scale=640:480 -b:v 1500k -maxrate 100k -bufsize 200k -threads 1 -acodec libfaac -b:a 128k "' + temp_folder + current_file.id + "/" + filename + '"';
        } else {
            filename = current_file.filename;
            var command = 'mv ' + queued_folder + current_file.id + "/" + current_file.filename + ' ' + temp_folder + current_file.id + "/" + current_file.filename;
        }
        var commands = new Array();
        var thumbs = new Array();
        var interval;
        //http://odino.org/ffmpeg-get-a-thumbnail-from-a-video-with-php/
        if (current_file.duration < current_file.thumbs) {
            current_file.thumbs = current_file.duration;
        }
        if (current_file.thumbs > 10) {
            current_file.thumbs = 10;
        }
        if (current_file.duration >= current_file.thumbs) {
            interval = current_file.duration / current_file.thumbs;
            for (var i = 0; i < current_file.thumbs; i++) {
                thumbs[i] = basename + i + '.jpg';
                commands[i] = 'ffmpeg  -y -i "' + completed_folder + current_file.id + "/" + filename + '" -loglevel quiet -filter:v yadif -an -ss ' + (interval * i + 1 * 1) + ' -t 00:00:01 -r 1 -vframes 1 -y -vcodec mjpeg -f mjpeg "' + temp_folder + current_file.id + "/thumbs/" + thumbs[i] + '" 2>&1';
            }
        } else {
            interval = current_file.duration / 2;
            thumbs[0] = basename + '0.jpg';
            commands[0] = 'ffmpeg -y -i "' + completed_folder + current_file.id + "/" + filename + '" -loglevel quiet -filter:v yadif -an -ss 1 -t 00:00:01 -r ' + interval + ' -y -vcodec mjpeg -f mjpeg "' + temp_folder + current_file.id + "/thumbs/" + thumbs[0] + '" 2>&1';
        }
        //var thumb = 'ffmpeg  -itsoffset -4  -i ' + queued_folder + current_file.filename + ' -vcodec mjpeg -vframes 1 -an -f rawvideo -s 320x240 ' + temp_folder + thumbname;
    } else if (current_file.output_type == 2) {
        filename = basename + '.mp3';
        var command = 'ffmpeg -y -i "' + queued_folder + current_file.id + "/" + current_file.filename + '" -loglevel quiet  "' + temp_folder + current_file.id + "/" + filename + '"';
    } else {
        console.log('=================================');
        console.log('= Error : Output type not valid =');
        console.log('=================================');
        return;
    }
    current_file.job_status = 'processing'
    console.log(command);
    current.push(current_file);
    exec(command, function(error, stdout, stderr) {
        if (error !== null) {
            console.log('Execution error: ' + error);
            //current_file = update_transaction_status(current_file,4);
            update_job_field(current_file.id, 'job_status', 'error')
            current_file.job_status = 'error'

        } else {
            exec('mv "' + temp_folder + current_file.id + "/" + filename + '" "' + completed_folder + current_file.id + "/" + filename + '"', function(error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: exists' + stderr);
                if (error !== null) {
                    console.log('Execution error: ' + error);
                    update_job_field(current_file.id, 'job_status', 'error')
                        //current_file = update_transaction_status(current_file,7);
                    var output = {};
                    output['file_id'] = current_file.id;
                    output['status'] = 'error';
                    send_callback(current_file.callback_url, output);
                } else {
                    console.log('==================================')
                    console.log('= Success : Encoding Successfull =');
                    console.log('==================================')
                    update_job_field(current_file.id, 'out_file_location', 'http://' + transcoder_ip + ':' + transcoder_port + '/' + current_file.id + "/" + filename)
                    var used_bandwidth = 0;
                    if (current_file.output_type == 0) {
                        fs.stat(completed_folder + current_file.id + "/" + filename, function(err, stats) {
                            used_bandwidth += stats.size
                            update_job_field(current_file.id, 'bandwidth', used_bandwidth)
                        });
                    } else {
                        fs.stat(current_file.input_file_path, function(err, stats) {
                            used_bandwidth += stats.size
                            fs.stat(completed_folder + current_file.id + "/" + filename, function(err, stats) {
                                used_bandwidth += stats.size
                                update_job_field(current_file.id, 'bandwidth', used_bandwidth)
                            });
                        });
                    }
                    //current_file = update_transaction_status(current_file,3);
                    var output = {};
                    output['id'] = current_file.id;
                    output['file_id'] = current_file.id;
                    output['file_url'] = 'http://' + transcoder_ip + ':' + transcoder_port + '/' + current_file.id + "/" + filename;
                    output['status'] = "completed";
                    output['file_name'] = filename;
                    output['file_path'] = completed_folder + current_file.id + "/" + filename;
                    output['apikey'] = current_file.apikey_id
                    if (current_file.output_type <= 1) {
                        checkAndCreateDirectory(temp_folder + current_file.id + "/thumbs/");
                        checkAndCreateDirectory(completed_folder + current_file.id + "/thumbs/");
                        generate_thumbs(commands, thumbs, 0, current_file.thumbs, current_file.callback_url, output);
                        update_job_field(current_file.id, 'job_status', 'completed')
                    } else {
                        completed.push(current_file);
                        send_callback(current_file.callback_url, output);
                        update_job_field(current_file.id, 'job_status', 'completed')
                    }
                }
            });
        }
        current.splice(current.indexOf(current_file), 1);
        processing--;
        queueHandler();
    });

}

function downloadfile(objJob) {
    var sys = require("sys"),
        http = require("http"),
        url = require("url"),
        path = require("path"),
        fs = require("fs"),
        events = require("events");

    var host = url.parse(objJob.input_file_url).hostname
    var filename = decodeURIComponent(url.parse(objJob.input_file_url).pathname.split("/").pop())

    update_job_field(objJob.id, 'job_status', 'processing');
    var part_filename = filename.split(".");

    var basename = part_filename[0];

    var input_newname = basename + "." + part_filename[part_filename.length - 1];
    var counter = 1;
    while (fs.existsSync(queued_folder + objJob.id + "/" + input_newname)) {
        input_newname = basename + counter.toString() + "." + part_filename[part_filename.length - 1];
        counter++;
    }

    sys.puts("Downloading file: " + input_newname);
    sys.puts("Before download request");
    var options = {
        port: 80,
        host: host,
        method: 'GET',
        path: objJob.input_file_url,
        timeout: 5000
    }

    var request = http.request(options);

    request.end();

    request.on('error', function(e) {
        console.log('Download error: ' + e);
        update_job_field(objJob.id, 'job_status', 'error');
        processing--;
        queueHandler();

        // objJob.job_status = 'error' ;
    });

    var dlprogress = 0;

    /**
     setInterval(function () {
     sys.puts("Download progress: " + dlprogress + " bytes");
     }, 1000); **/
    request.addListener('response', function(response) {
        var download_file = fs.createWriteStream(queued_folder + objJob.id + "/" + input_newname, {
            'flags': 'a'
        });
        sys.puts("File size " + input_newname + ": " + response.headers['content-length'] + " bytes.");
        response.addListener('data', function(chunk) {
            dlprogress += chunk.length;
            download_file.write(chunk, encoding = 'binary');
        });
        response.addListener("end", function() {
            download_file.end();
            sys.puts("Finished downloading " + input_newname);

            objJob.input_file_path = queued_folder + objJob.id + "/" + input_newname
                // update database
            update_job_field(objJob.id, 'input_file_path', objJob.input_file_path)
                //call thread
            start_encoding(objJob)
        });
    });
}

function update_job_field(job_id, field_name, field_value) {
    var httpsync = require('httpsync');
    var req = httpsync.get(server_url + "/server/" + server_id + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value);
    //req = http.get(server_url + "/server/" + server_id + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value, function(respo) {
    //console.log(job_id + " Updated : " + field_name + ' ---> ' + field_value)
    //})
    var res = req.end();
    console.log(res);
}

function queueHandler() {
    if (processing >= max_processing) {
        console.log('Max Processors already allocated');
        return true;
    }
    console.log('Processing Queue...');
    var current_file = queue.shift();

    if (current_file) {

        processing++;
        var error = 0;

        if (typeof(current_file.callback_url) === undefined) {
            console.log('=======================================');
            console.log('= Error : Callback URL is not defined =');
            console.log('=======================================');
            error = 1;
        }

        if (typeof(current_file.request_formats) === undefined) {
            console.log('======================================');
            console.log('= Error : Output type is not defined =');
            console.log('======================================');
            error = 1;
        }

        if (typeof(current_file.id) === undefined) {
            console.log('===================================');
            console.log('= Error : Media ID is not defined =');
            console.log('===================================');
            error = 1;
        }

        if (typeof(current_file.input_file_url) === undefined) {
            console.log('===================================');
            console.log('= Error : Filename is not defined =');
            console.log('===================================');
            error = 1;
        }

        if (error) {
            return;
        }
        checkAndCreateDirectory(queued_folder + current_file.id);
        checkAndCreateDirectory(temp_folder + current_file.id);
        checkAndCreateDirectory(completed_folder + current_file.id);

        if (current_file.input_file_path != undefined && current_file.input_file_path != null && fs.existsSync(decodeURIComponent(current_file.input_file_path))) {
            current_file.input_file_path = decodeURIComponent(current_file.input_file_path)
            start_encoding(current_file)
        } else {
            current_file.input_file_url = decodeURIComponent(current_file.input_file_url)
            downloadfile(current_file)
        }

    }
}

process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

function db_run_error_handler(command) {
    try {
        db.run(command, function(error) {
            if (error) {
                throw error;
            }
        });
    } catch (err) {
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


function generate_thumbs(commands, thumbs, start, end, callback_url, output) {
    if (start !== undefined) {
        if ((start < end) && (start in commands)) {
            var next = start;
            console.log(commands[start]);
            exec(commands[start], function(error, stdout, stderr) {

                if (error !== null) {
                    console.log('Execution error: ' + error);
                    console.log('Thumbnail ' + (start * 1 + 1) + ' could not be created');
                    next = start + 1;
                    if ((next < end) && (next in commands)) {
                        generate_thumbs(commands, thumbs, next, end, callback_url, output);
                    } else {
                        send_callback(callback_url, output);
                    }
                } else {
                    console.log('Thumbnail ' + (start * 1 + 1) + ' Created Successfully');
                    exec('mv "' + temp_folder + output.id + "/thumbs/" + thumbs[start] + '" "' + completed_folder + output.id + "/thumbs/" + thumbs[start] + '"', function(error, stdout, stderr) {
                        if (error !== null) {
                            console.log('Execution error: ' + error);
                        }
                    });
                    next = start + 1;
                    output['thumb_' + next] = output.id + '/thumbs/' + thumbs[start];
                    if ((next < end) && (next in commands)) {
                        generate_thumbs(commands, thumbs, next, end, callback_url, output);
                    } else {
                        send_callback(callback_url, output);
                    }
                }
            });
        } else {
            console.log('==================================================');
            console.log('= Error : Start not in                           =');
            console.log('==================================================');
            send_callback(callback_url, output);
        }
    } else {
        console.log('==================================================');
        console.log('= Error : Start not defined in generate_thumbs() =');
        console.log('==================================================');
        send_callback(callback_url, output);
    }

}

function send_callback(callback_url, output) {
    var callback = url.parse(server_callback);
    var out_text = JSON.stringify(data);
    var querystring = require('querystring');
    var data = querystring.stringify(output);
    var options = {
        host: callback.hostname,
        port: callback.port,
        path: callback.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    };
    console.log(options);

    var req = http.request(options, function(res) {
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
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

app = connect()
app.use(connect.static(completed_folder))
app.use(connect.query())
app.use(connectRoute(function(router) {
    router.post('/', function(req, res, next) {
        console.log(req.query)
        res.end("Wellcome")
    })
    router.get('/', function(req, res, next) {
        console.log(req.query)
        res.end("Wellcome")
    })
    router.get('/loadpending', function(req, res, next) {
        get_pending_job();
        res.end("Wellcome")
    })
    router.get('/updateduration', function(req, res, next) {
        get_pending_duration();
    })

    function get_pending_duration() {
        req = http.get(server_url + "/server/" + server_id + "/getalljobs/", function(respo) {
            respo.setEncoding('utf8');
            respo.on('data', function(chunk) {
                console.log(chunk);
                j = JSON.parse(chunk);
                if (j != undefined) {
                    console.log(j.jobs.length + " Found");
                    var count = 0
                    for (var rCount = 0; rCount < j.jobs.length; rCount++) {
                        current_file = j.jobs[rCount];
                        var result = execSync.exec("ffmpeg -y -i " + current_file.input_file_path);
                        console.log('return code ' + result.code);
                        console.log('stdout + stderr ' + result.stdout);
                        stdout = result.stdout + result.stderr;
                        count++
                        if (stdout != undefined && stdout.split('Duration: ')[1] != undefined) {
                            stdout = stdout.split('Duration: ')[1].split(', start: ')[0];

                            console.log('Duration: ' + stdout);
                            if (stdout != undefined) {
                                update_job_field(current_file.id, 'duration', stdout);
                            } else {
                                update_job_field(current_file.id, 'duration', "00:00:00.00");
                            }

                        } else {
                            update_job_field(current_file.id, 'duration', "00:00:00.00");
                        }
                        if (count >= 5)
                            get_pending_duration()
                    }
                }
            });
        });
    }
    router.get('/new', function(req, res, next) {
        //console.log(req)
        res.setHeader('Content-Type', 'application/json');
        var output = {};
        output.status = false;
        if (req.query == undefined) {
            output.message = "Invalid Request URL"
            res.end(JSON.stringify(output));
            return;
        }
        if (req.query.jobid == undefined) {
            output.message = "Missing Job ID";
            res.end(JSON.stringify(output));
            return;
        }
        //		connection.connect();

        console.log(server_url + "/server/" + server_id + "/getjob/" + req.query.jobid)
        req = http.get(server_url + "/server/" + server_id + "/getjob/" + req.query.jobid, function(respo) {
            respo.setEncoding('utf8');
            respo.on('data', function(chunk) {
                console.log(chunk);
                jobs = JSON.parse(chunk)
                add_job_to_queue(jobs);
                res.end("done");
            })
        })

    });

}));

// Fetch all job from database that are not processed
function add_job_to_queue(job_row) {
    for (var rCount = 0; rCount < queue.length; rCount++) {
        if (queue[rCount].id == job_row.id)
            return false;
    }
    console.log("job added : " + job_row["id"])
    queue.push(job_row)
    queueHandler();
}



var pending_json_str = '';

function get_pending_job() {
    var callback = url.parse(server_url + "/server/" + server_id + "/gejobs");
    req = http.get(server_url + "/server/" + server_id + "/getjobs/", function(respo) {
        respo.setEncoding('utf8');
        respo.on('data', function(chunk) {
            pending_json_str += chunk.toString();
        });
        respo.on('end', function() {
            allJob = JSON.parse(pending_json_str)
            pending_json_str = '';
            if (allJob.jobs != undefined) {
                for (var rCount = 0; rCount < allJob.jobs.length; rCount++) {
                    add_job_to_queue(allJob.jobs[rCount]);
                }
            }
        });
    })
}
get_pending_job()
app.listen(transcoder_port);
