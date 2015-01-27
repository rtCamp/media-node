/*********************************************************
  Main Entry Point

  1. Define all API endpoints as express routes
  2. Seprate out ffmpeg related code. Move them to fluent-ffmpeg
  3. Make use of database (not queue - becasue data will keep on adding)
*********************************************************/

/*********************************************************
    node.js requires
*********************************************************/

var express = require('express'),
    fs = require('fs'),
    url = require('url'),
    formidable = require('formidable'),
    mv = require('mv'),
    path = require('path'),
    ffmpeg = require('fluent-ffmpeg'),
    http = require("http"),
    httpsync = require('httpsync'),
    du = require('du'),
    models = require("./models");

// config
var env = process.env.NODE_ENV || "development",
    config = require('./config.json')[env];

/**********************************************************
    express.js routes
**********************************************************/
// app
var app = express();

// static files
app.use(express.static('/files', __dirname + '/files'));
app.use(express.static(__dirname + '/'));

// Homepage should show video-upload form
app.get('/', function(req, res) {
    res.send(
        '<form action="/upload" enctype="multipart/form-data" method="post">' +
        '<input type="text" name="callback_url"><br>' +
        '<input type="text" name="media_type"><br>' +
        '<input type="file" name="upload" multiple="multiple"><br>' +
        '<input type="submit" value="Upload">' +
        '</form>'
    );
})

// status check
app.get('/status', function(req, res) {
    res.send('All is well');
})

// version check
app.get('/version', function(req, res) {
    res.send('Working on v2');
})

// Upload video directly here
app.post('/upload', function(req, res) {
    rtHandleUpload(req, res)
})

// new job to queue
app.get('/new', function(req, res) {
    rtAPIGetJobs()
    res.send('Will process new jobs right away!')
})

/*********************************************************
    api.rtcamp.com related functions
*********************************************************/

//fetch pendig jobs
function rtAPIGetJobs() {
    var body = '';
    http.get(config.apiserver + 'getjobs', function(response) {
                // Continuously update stream with data
                response.on('data', function(d) {
                    body += d;
                });
                response.on('end', function() {
                    // Data reception is done, do whatever with it!
                    var parsed = JSON.parse(body);
                    parsed.jobs.forEach(function(job) {
                        //save to database
                        rtAddJobByURL(job)
                    })
                    console.log(parsed); //json
                });
                response.on('error', function(err) {
                    console.log("Error: " + err.message);
                });
            } //end of callback
        ) //end of http
    rtProcessQueue(); //start processing local job queue
}

function rtAPIUpdateJob(job_id, field_name, field_value) {
    var req = httpsync.get(config.apiserver + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value);
    //req = http.get(server_url + "/server/" + server_id + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value, function(respo) {
    //console.log(job_id + " Updated : " + field_name + ' ---> ' + field_value)
    //})
    var res = req.end();
    console.log(res);
}

function rtAPIFireCallback(callback_url, output) {
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

/*********************************************************
    Store incoming upload request in local database
*********************************************************/
function rtAddJobByURL(job) {
        //set a local filename
        var filename = url.parse(job.input_file_url).pathname.split('/').pop();
        var filepath = config.folder + '/' + job.id + '/' + filename;

        rtDirCheck(config.folder + '/' + job.id);

        //download file from url
        var file = fs.createWriteStream(filepath);

        http.get(job.input_file_url, function(res) {
            res.on('data', function(data) {
                file.write(data);
            }).on('end', function() {
                file.end();
                console.log('Downloaded ' + filepath);
            });
        });

        //save to database
        models.Job.create({
            api_job_id: job.id,
            original_file_path: filepath,
            original_file_url: 'http://' + config.host + ':' + config.port + '/' + path.normalize(filepath),
            request_formats: job.request_formats,
            thumb_count: job.thumbs,
            bandwidth: job.bandwidth,
            callback_url: job.callback_url,
            duration: rtGetDuration(filepath)
        }).then(function(job) {
            console.log("Saved new job with #ID = " + job.id);
        })

    } //end of function

function rtAddJobByFile(filename, request_format, size, thumbcount) {
        if (!thumbcount) {
            thumbcount = 5;
        }
        if (!request_format) {
            request_format = 'mp4';
        }
        if (!size) {
            var stats = fs.statSync(filename);
            size = stats.size;
        }

        models.Job.create({
            original_file_path: filename,
            original_file_url: 'http://' + config.host + ':' + config.port + '/' + filename,
            request_formats: request_format,
            thumb_count: thumbcount,
            bandwidth: size
        }).then(function(job) {
            console.log("Saved new job with #ID = " + job.id);
        })
    } //end function

function rtHandleUpload(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var inFileName = config.folder + '/' + files.upload.name;
        console.log("Saving as " + inFileName)
        mv(files.upload.path, inFileName, {
            mkdirp: true
        }, function(err) {
            if (err) {
                console.log("ERROR" + err);
                res.status(500);
                res.json({
                    'success': false
                });
            } else {
                //save to database
                rtAddJobByFile(inFileName)
                rtProcessQueue();
                res.status(200);
                res.json({
                    'success': true
                });
            }
        });
    });
}

function rtUpdateJobStatus(job_id, job_status) {
        models.Job.update({
                    status: job_status
                },
                // Where clause / criteria
                {
                    _id: job_id
                }
            )
            .success(function() {
                console.log("Database updates successfully for job #" + job.id);
            })
            .error(function(err) {
                console.log("Database update failed for job #" + job.id);
            })
    } // end of rtUpdateJobStatus

function rtUpdateJobBandwidth(job_id, job_dir) {
        var dirsize = 0;

        du(job_dir, function(err, size) {
            console.log('The size of' + path.dirname(job_dir) + ' is:', size, 'bytes')
            dirsize = size;
        })
        models.Job.update({
                    bandwidth: dirsize
                },
                {
                    where: {id: job_id}
                }
            )
            .success(function() {
                console.log("Database updates successfully for job #" + job_id);
            })
            .error(function(err) {
                console.log("Database update failed for job #" + job_id);
            })
    } // end of rtUpdateJobStatus

/*********************************************************
Encoder
*********************************************************/

/* Find all videos which are not encoded yet and encode each of them */

function rtProcessQueue() {
    //Find all jobs with status 'queued'
    models.Job.findAll({
        where: {
            status: "queued"
        }
    }).success(function(jobs) {
            jobs.forEach(function(job) {
                console.log("processing " + job.id + job.original_file);
                switch (job.request_formats) {
                    case 'mp4':
                        rtEncodeVideo(job);
                        break
                    case 'mp3':
                        rtEncodeAudio(job);
                        break
                    case 'thumbnails':
                        rtGenerateThumbnails(job);
                        break
                    default:
                        console.log("request_formats is not set for Job #" + job.id)
                }
                //update bandwidth
                rtUpdateJobBandwidth(job.id, path.dirname(job.original_file))

                console.log(job)

                rtAPIUpdateJob(job.api_job_id, 'rtUpdateJobBandwidth', job.bandwidth);

                //update remote API
                rtAPIUpdateJob(job.api_job_id, 'duration', job.duration);

                //update job status at API
                rtAPIUpdateJob(job.api_job_id, 'job_status', job.status);

                //update out_file_location
                rtAPIUpdateJob(job.api_job_id, 'out_file_location', job.original_file_url)

            })
    })
} //end of processQueue

function rtEncodeVideo(job) {
        // make sure you set the correct path to your video file
        var inFile = job.original_file_path
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))
            // console.log(outFile);

        var proc = ffmpeg(inFile)
            //mp4
            .output(outFile + '.mp4')
            .videoCodec('libx264')
            .outputOptions(
                '-profile:v', 'baseline',
                '-preset', 'slower',
                '-pix_fmt', 'yuv420p',
                '-crf', '18'
            )
            .videoFilters('scale=trunc(in_w/2)*2:trunc(in_h/2)*2')

        //webm
        .output(outFile + '.webm')
            .videoCodec('libvpx')
            .audioCodec('libvorbis')
            .outputOptions(
                '-b:v', '2M',
                '-quality', 'good',
                '-pix_fmt', 'yuv420p',
                '-crf', '5'
            )
            .videoFilters('scale=trunc(in_w/2)*2:trunc(in_h/2)*2')

        //ogv
        .output(outFile + '.ogv')
            .videoCodec('libtheora')
            .audioCodec('libvorbis')
            .outputOptions(
                '-pix_fmt', 'yuv420p',
                '-q', '5'
            )

        .on('start', function(commandLine) {
                console.log('Command: ' + commandLine);
                rtUpdateJobStatus(job.id, 'processing');
            })
            .on('end', function(err, stdout, stderr) {
                if (err) {
                    console.log('ERROR ' + err)
                    rtUpdateJobStatus(job.id, 'error');
                } else {
                    console.log('SUCCESS');
                    rtUpdateJobStatus(job.id, 'succes');
                }
                console.log(stdout)
            })
            .on('progress', function(progress) {
                console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
                rtUpdateJobStatus(job.id, 'processing');
            })
            .on('error', function(err) {
                console.log('ERROR ' + err);
                rtUpdateJobStatus(job.id, 'error');
                console.log(stdout)
            })

        //take screenshots
        .screenshots({
                count: job.thumb_count,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //start actual work
    } //end of rtEncodeVideo

function rtEncodeAudio(job) {
        var inFile = job.original_file_path
            // make sure you set the correct path to your video file
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))
            // console.log(outFile);

        var proc = ffmpeg(inFile)
            //mp3
            .output(outFile + '.mp3')
            .audioCodec('libmp3lame')
            .outputOptions(
                '-q:a', '0',
                '-map', '0:a:0'
            )

        //ogg
        .output(outFile + '.ogv')
            .audioCodec('libvorbis')
            .outputOptions(
                '-q:a', '0',
                '-map', '0:a:0'
            )

        .on('start', function(commandLine) {
                console.log('Command: ' + commandLine);
                rtUpdateJobStatus(job.id, 'processing');
            })
            .on('end', function(err, stdout, stderr) {
                if (err) {
                    console.log('ERROR ' + err)
                    rtUpdateJobStatus(job.id, 'error');
                } else {
                    console.log('SUCCESS');
                    rtUpdateJobStatus(job.id, 'succes');
                }
                console.log(stdout)
            })
            .on('progress', function(progress) {
                console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
                rtUpdateJobStatus(job.id, 'processing');
            })
            .on('error', function(err) {
                console.log('ERROR ' + err);
                rtUpdateJobStatus(job.id, 'error');
                console.log(stdout)
            })

        .run(); //start actual work
    } //end of rtEncodeAudio

function rtGenerateThumbnails(job) {
        // make sure you set the correct path to your video file
        var inFile = job.original_file_path
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))
            // console.log(outFile);

        var proc = ffmpeg(inFile)
            .on('start', function(commandLine) {
                console.log('Command: ' + commandLine);
                rtUpdateJobStatus(job.id, 'processing');
            })
            .on('end', function(err, stdout, stderr) {
                if (err) {
                    console.log('ERROR ' + err)
                    rtUpdateJobStatus(job.id, 'error');
                } else {
                    console.log('SUCCESS');
                    rtUpdateJobStatus(job.id, 'succes');
                }
                console.log(stdout)
            })
            .on('progress', function(progress) {
                console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
                rtUpdateJobStatus(job.id, 'processing');
            })
            .on('error', function(err) {
                console.log('ERROR ' + err);
                rtUpdateJobStatus(job.id, 'error');
                console.log(stdout)
            })
            //take screenshots
            .screenshots({
                count: job.thumb_count,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //start actual work
    } //end of rtGenerateThumbnails

function rtGetDuration(inFile) {
    var proc = ffmpeg(inFile)
        .ffprobe(function(err, data) {
            if(err){
                console.log(err)
            }else{
                return data.format.duration;
            }
        });
}

/*********************************************************
Make sure media folders are present before api takes over
*********************************************************/

function rtDirCheck(dir) {
    //top-level media folder
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

/*********************************************************
    START Execution
*********************************************************/

models.sequelize.sync().then(function() {
    var server = app.listen(config.port, config.host, function() {
        var host = server.address().address
        var port = server.address().port
        console.log('Media-node is listening at http://%s:%s', host, port);
        rtDirCheck(config.folder); //make sure media storgae folders are present
        rtAPIGetJobs(); //get pending jobs via api.rtcamp.com
        rtProcessQueue(); //start processing local job queue
        // rtGetMeta('files/gaganam.mov');
    });
});
