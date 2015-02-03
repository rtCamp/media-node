/*********************************************************
  Main Entry Point
*********************************************************/

/**
 * node.js requires
 **/
var formidable = require('formidable')
var mv = require('mv')

//local modules
var dbjob = require('./lib/db.js');
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

    form.parse(req, function(err, fields, files) {
        util.makedir(config.folder + '/' + fields.media_id + '/') //create job dir
        console.log(fields)
        var inFileName = config.folder + '/' + fields.media_id + '/' + files.upload.name;
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
                rtAddJobByFile(inFileName, fields)
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

function rtAddJobByFile(filename, fields) {
        var format;

        switch (fields.media_type) {
            case 'video':
                format: 'mp4';
                break
            case 'audio':
                format: 'mp4';
                break
            case 'thumbs':
                format: 'thumbnails';
                break
        }

        var newJob = {
            api_job_id: fields.media_id,
            original_file_path: filename,
            original_file_url: 'http://' + config.host + ':' + config.port + '/' + filename,
            request_formats: format,
            callback_url: fields.callback_url,
            thumb_count: fields.thumbs
        };

        console.log('Tryin to save new job ')
        console.log(newJob)
            //create new job in DB
        dbjob.create(newJob, function(job) {
            console.log("New job created")
            console.log(job)
            queue.encode(job.id, function() {
                fireCallback(job)
            })
        });
    } //end function


/**
 * Execute callback for given job id
 * @param job - <job> object
 **/

function fireCallback(job) {
        output = {
            media_id: job.api_job_id,
            status: job.status,
            file_url: job.original_file_url,
        }

        //thumbnail loop
        console.log("Opening Dir " + path.dirname(job.original_file_path))

        var files = fs.readdirSync(path.dirname(job.original_file_path));
        var i = 1;

        files.forEach(function(file) {
                if (path.extname(file) === ".png") {
                    output['thumb_' + i++] = path.dirname(job.original_file_path) + '/' + file
                }
            }) //end of inner loop
        console.log("Executing callback for job # " + job.id);
        console.log("CALLBACK OUTPUT BELOW");
        console.log(output);

        request.post({
                    url: job.callback_url,
                    form: output,
                },
                function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        // console.log(response)
                        console.log("callback success")
                    } else {
                        console.log("callback failed")
                        console.log(error);
                    }
                } //end of function
            ) //end of request.post
    } //end of rtAPIFireCallback


/*********************************************************
    START Execution
*********************************************************/

dbjob.init(function() {
        var server = app.listen(config.port, config.host, function() {
            var host = server.address().address
            var port = server.address().port
            console.log('Media-node is listening at http://%s:%s', host, port);
            util.makedir(config.folder); //make sure media storgae folders are present
            queue.process(function(job) {
                fireCallback(job)
            }); //start processing local job queue
        });
    }) //end of dbjob
