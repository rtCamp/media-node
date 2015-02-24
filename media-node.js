/*********************************************************
  Main Entry Point
*********************************************************/

/**
 * node.js requires
 **/
var formidable = require('formidable')
var mv = require('mv')

//local modules
var db = require('./app/db.js');
var util = require('./app/util.js');
var queue = require('./app/queue.js');
var app = require('./app/app.js');

// config
var env = process.env.NODE_ENV || 'development';
var config = require('./config.json')[env];

/**
 * Express route to handle HTTP POST file.
 */
app.post('/upload', rtHandleUpload); //handle upload

/**
 * rtHandleUpload - File upload handling
 * 1. Process upload form
 * 2. Create database entry db.create
 * 3. Send job for encoding queue.processSingle
 * @param  {object} req    HTTP request object with form fields
 * @param  {type} res      HTTP response object whose values we need to set
 * @return {type}          description
 */
function rtHandleUpload(req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    console.log(fields)
    util.makedir(config.folder + '/' + fields.mediaid + '/') //create dir for this job
    var inFileName = config.folder + '/' + fields.mediaid + '/' + files.upload.name;
    console.log('Saving as ' + inFileName)
    mv(files.upload.path, inFileName, function(err) {
      if (err) {
        console.log('ERROR' + err);
        res.status(500);
        res.json({
          success: false
        });
      } else {
        //save to database
        rtAddJobByFile(inFileName, fields)
        res.status(200);
        res.json({
          success: true
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
    var format = fields.mediatype;

    switch (fields.mediatype) {
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
      apiJobId: fields.mediaid,
      originalFilePath: filename,
      originalFileUrl: 'http://' + config.host + ':' + config.port + '/' + filename,
      requestFormats: format,
      callbackUrl: fields.callbackurl,
      thumbCount: fields.thumbs
    };

    console.log('Tryin to save new job ')
    console.log(newJob)

    //create new job in DB
    db.create(newJob, function(job) {
      console.log('New job created')
      queue.processSingle(job, function(s) {
        console.log(s)
      })
    });
  } //end function

/**
 * Execute callback for given job id
 * @param job - <job> object
 **/

function fireCallback(job) {
    output = {
      mediaid: job.apiJobId,
      status: job.status,
      fileUrl: job.originalFileUrl,
    }

    //thumbnail loop
    console.log('Opening Dir ' + path.dirname(job.originalFilePath))

    var files = fs.readdirSync(path.dirname(job.originalFilePath));
    var i = 1;

    files.forEach(function(file) {
        if (path.extname(file) === '.png') {
          output['thumb_' + i++] = path.dirname(job.originalFilePath) + '/' + file
        }
      }) //end of inner loop
    console.log('Executing callback for job # ' + job.id);
    console.log('CALLBACK OUTPUT BELOW');
    console.log(output);

    request.post({
          url: job.callbackUrl,
          form: output
        },
        function(error, response, body) {
          if (!error && response.statusCode == 200) {
            // console.log(response)
            console.log('callback success')
          } else {
            console.log('callback failed')
            console.log(error);
          }
        } //end of function
      ) //end of request.post
  } //end of rtAPIFireCallback

/*********************************************************
    START Execution
*********************************************************/

db.init(function() {
    var server = app.listen(config.port, config.host, function() {
      var host = server.address()
        .address
      var port = server.address()
        .port
      console.log('Media-node is listening at http://%s:%s', host, port);
      util.makedir(config.folder); //make sure media storgae folders are present
      // queue.process(function(job) {
      //     fireCallback(job)
      // }); //start processing local job queue
    });
  }) //end of db
