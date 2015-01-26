/*********************************************************
  Main Entry Point

  1. Define all API endpoints as express routes
  2. Seprate out ffmpeg related code. Move them to fluent-ffmpeg
  3. Make use of database (not queue - becasue data will keep on adding)

*********************************************************/


/*********************************************************
    require
*********************************************************/

var express = require('express'),
    fs = require('fs'),
    formidable = require('formidable'),
    mv = require('mv'),
    models = require("./models"),
    app = express();

// config
var env = process.env.NODE_ENV || "development",
    config = require('./config.json')[env];

/*********************************************************
    Encoder
*********************************************************/
/*
    1. Find all videos which are not encoded yet
    2. For each one - run encoding
*/

function processQueue() {
        //Find all jobs with status 'queued'
        models.Job.findAll({
                where: {
                    status: "queued"
                }
            })
            .success(function(err, job) {
                console.log(job.id);
                console.log(job.original_file);
                if (err) {
                    console.log("oh error! :(")
                } else {
                    console.log(job);
                }
            })
    } //end of processQueue



/**********************************************************
    express.js routes
**********************************************************/

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

/*********************************************************
    Make sure media folders are present before api takes over
*********************************************************/

function rtHandleUpload(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        console.log(files.upload.path);
        console.log(files.upload.name);
        mv(files.upload.path, config.folder + files.upload.name, {
            mkdirp: true
        }, function(err) {
            console.log(err);
            if (err) {
                res.status(500);
                res.json({
                    'success': false
                });
            } else {
                //save to database
                models.Job.create({
                    original_file: './media/' + files.upload.name
                }).then(function(job) {
                    console.log("Saved new job with #ID = " + job.id);
                })
                res.status(200);
                res.json({
                    'success': true
                });
            }

        });
    });

}
function rtDirCheck() {
    //top-level media folder
    if (!fs.existsSync(config.folder)) {
        fs.mkdirSync(config.folder);
    }
}

/*********************************************************
    START Execution
*********************************************************/

models.sequelize.sync().then(function() {
    var server = app.listen(config.port, config.host, function() {
        var host = server.address().address
        var port = server.address().port
        console.log('Example app listening at http://%s:%s', host, port);
        rtDirCheck();
        processQueue();
    });
});
