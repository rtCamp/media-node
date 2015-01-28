/*********************************************************
  Main Entry Point
*********************************************************/

/**
 * node.js requires
 **/

var express = require('express')
var fs = require('fs')
var url = require('url')
var formidable = require('formidable')
var mv = require('mv')
var path = require('path')
var http = require("http")
var httpsync = require('httpsync')

//local modules
var job = require('./lib/db.js');
var encode = require('./lib/encode.js');
var util = require('./lib/util.js');
var queue = require('./lib/queue.js');

// config
var env = process.env.NODE_ENV || "development";
var config = require('./config.json')[env];

/**********************************************************
    express.js routes
**********************************************************/
// express app
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
    rtHandleUpload(req, res); //handle upload
    rtProcessQueue(); //start processing local job queue
})

// new job to queue
// app.get('/new', function(req, res) {
//     rtAPIGetJobs()
//     res.send('Will process new jobs right away!')
// })

/**
* Direct file upload form
**/

function rtHandleUpload(req, res) {
    var form = new formidable.IncomingForm();
    var ts = Math.floor(new Date() / 1000) //unix timestamp

    form.parse(req, function(err, fields, files) {
        rtDirCheck(config.folder + '/' + ts + '/') //create job dir
        var inFileName = config.folder + '/' + ts + '/' + files.upload.name;
        console.log("Saving as " + inFileName)
        mv(files.upload.path, inFileName, function(err) {
            if (err) {
                console.log("ERROR" + err);
                res.status(500);
                res.json({
                    'success': false
                });
            } else {
                //save to database
                rtAddJobByFile(inFileName, ts)
                res.status(200);
                res.json({
                    'success': true
                });
            }
        });
    });
}

/*********************************************************
    Other Functions
*********************************************************/

/**
 * Add new job to database based on input file path
 **/

function rtAddJobByFile(filename, ts) {
        var newJob = {
            api_job_id: ts,
            original_file_path: filename,
            original_file_url: 'http://' + config.host + ':' + config.port + '/' + filename,
        };
        //create new job in DB
        job.create(newJob);
    } //end function

/**
 * Start Encoding
 **/

function rtProcessQueue() {
        job.find('queued', function(jobs) {
            jobs.forEach(function(job) {
                console.log("processing " + job.id + job.original_file_path);
                switch (job.request_formats) {
                    case 'mp4':
                        console.log('video #' + job.id)
                        encode.video(job);
                        break
                    case 'mp3':
                        encode.audio(job);
                        break
                    case 'thumbnails':
                        encode.thumbnails(job);
                        break
                    default:
                        console.log("request_formats is not set for Job #" + job.id)
                }
            })
        })
    } //end of processQueue



/*********************************************************
    START Execution
*********************************************************/

var server = app.listen(config.port, config.host, function() {
    var host = server.address().address
    var port = server.address().port
    console.log('Media-node is listening at http://%s:%s', host, port);
    util.makedir(config.folder); //make sure media storgae folders are present
    queue.process(); //start processing local job queue
});
