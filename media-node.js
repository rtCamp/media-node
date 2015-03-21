/*********************************************************
  Main Entry Point
*********************************************************/

/**
 * node.js requires
 **/
var formidable = require('formidable')
var mv = require('mv')
var async = require('async')

//local modules
var db = require('./app/db.js')
var util = require('./app/util.js')
var queue = require('./app/queue.js')
var app = require('./app/app.js')

// config
var env = process.env.NODE_ENV || 'development'
var config = require('./config.json')[env]

/**
 * Express route to handle HTTP POST file.
 */
app.post('/upload', rtHandleUpload); //handle upload

/**
 * rtHandleUpload - File upload handling
 *
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
 * rtAddJobByFile - Add new job to database based on input file path
 *
 * @param  {string} filename    local filesystem path for input file
 * @param  {object} fields      form fields
 */
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
 *
 * @param job - <job> object
 **/

/**
 * fireCallback - Execute callback for given job
 *
 * @param  {object}     job     single job object
 */
function fireCallback(jobId) {
    output = {
      mediaid: job.apiJobId,
      status: job.status,
      fileUrl: job.originalFileUrl
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

    console.log('Dumping OUTPUT BELOW');
    console.log(output);

    console.log('Executing callback for job # ' + job.id);

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

function queueBatchCallback(err, status) {
  if (err) {
    callback('error', 'Error occured during batch processing')
  } else {
    callback(null, status + ' status batch processing completed successfully')
  }
}

function processPending() {
  queue.processBatch('queued', function() {
      console.log('Inside processPending :: queued jobs done')
      queue.processBatch('processing', function() {
        console.log('Inside processPending :: processing jobs done')
      })
    })
}

/*********************************************************
    START Execution
*********************************************************/

db.init(function() {
    var server = app.listen(config.port, config.host, function() {
      var host = server.address().address
      var port = server.address().port
      console.log('Media-node is listening at http://%s:%s', host, port)
        //make sure media storgae folders are present
      util.makedir(config.folder)
      console.log('Processig pending jobs from last time')
      // processPending()
      async.series([
          function(callback) {
            queue.processBatch('queued', callback)
          },
          function(callback) {
            queue.processBatch('processing', callback)
          }
        ],
        // optional callback
        function(err, results) {
          console.log('callback is executed for async.series')
          if (err) {
            console.log(err)
          }
          console.log(results)
        })
      // var statusList = ['queued', 'processing']
      // statusList.forEach(function(status) {
      //   queue.processBatch(status, queueBatchCallback)
      // })

      // var q = async.queue(function(status, callback) {
      //   queue.processBatch(status, queueBatchCallback)
      //   callback();
      // }, 1);
      // // assign a callback
      // q.drain = function() {
      //   console.log('all pending jobs has been processed');
      // }
      // q.push('queued', function(err) {
      //   console.log('finished jobs with status = queued');
      // });
      // q.push('processing', function(err) {
      //   console.log('finished jobs with status = processing');
      // });

      // queue.process(function(job) {
      //     fireCallback(job)
      // }); //start processing local job queue
    });
  }) //end of db
