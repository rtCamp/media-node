/*********************************************************
  Main Entry Point
*********************************************************/

/**
 * node.js requires
 **/
var formidable = require('formidable')
var mv = require('mv')

//local modules
var job = require('./lib/db.js');
var encode = require('./lib/encode.js');
var util = require('./lib/util.js');
var queue = require('./lib/queue.js');
var app = require('./lib/app.js');

// config
var env = process.env.NODE_ENV || "development";
var config = require('./config.json')[env];

/**
 * API File Upload
 **/
// Upload video directly here
app.post('/upload', function(req, res) {
    rtHandleUpload(req, res); //handle upload
    queue.process(); //start processing local job queue
})

/**
 * Direct file upload form
 **/

function rtHandleUpload(req, res) {
    var form = new formidable.IncomingForm();
    var ts = Math.floor(new Date() / 1000) //unix timestamp

    form.parse(req, function(err, fields, files) {
        util.makedir(config.folder + '/' + ts + '/') //create job dir
        console.log(fields)
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
                rtAddJobByFile(inFileName, ts, fields)
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
