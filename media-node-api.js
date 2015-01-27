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
