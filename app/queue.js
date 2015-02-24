/**
    Queue Manager - a wrapper around encoder and database

    Usage:
    ======

    var queue = require('./queue.js');                             // create object

    queue.processBatch(job_status, callback)
    queue.processsSingle(job_id, callback)

**/
var async = require('async')

var db = require('./db.js')
var encoder = require('./encode.js')

// var updateStatus = function(jobId, status) {
//   db.updateStatus(jobId, status)
//   })
// }

/**
 * Encodes a single Job and updates database values for it.
 * Upon success, fires callbackUrl.
 * output files are generated in same folder in which input file is present
 * @param - job object
 * @param - callback
 **/

var processSingle = function processSingle(job, callback) {
    console.log('Starting encoding ' + job.id)
    switch (job.requestFormats) {
    case 'mp4':
      encoder.video(job.originalFilePath, job.thumbCount, db.updateStatus(job.id, status))
      break
    case 'mp3':
      encoder.audio(job.originalFilePath, db.updateStatus(job.id, status))
      break
    case 'thumbnails':
      encoder.thumbnails(job.originalFilePath, job.thumbCount, db.updateStatus(job.id, status))
      break
    default:
      console.log('ERROR : requestFormats is not set for Job #' + job.id)
    } //end of switch
    callback()
  } //end of encode

/**
 * Start Processing Encoding Job Queue
 * TODO
   ====
   1. Use async. May be https://github.com/caolan/async#queue
 **/

exports.processBatch = function(status, callback) {
  console.log('Starting batch processing for job queue with status: ' + status)
  db.find(status, function(jobs) {
    if (jobs.length === 0) {
      console.log('There are no pending jobs with status ' + status)
      return
    }
    console.log('Found Jobs ' + jobs.length + ' with status ' + status)

    jobs.forEach(function(job) {
      processSingle(job, function() {
        console.log('Inside queue.processSingle :: job' + job.id + 'finished')
      })
    })

    // async.eachSeries(jobs, processSingle, function(err) {
    //   if (err) {
    //     console.log('Error occured during batch processing')
    //     console.log(err)
    //   } else {
    //     console.log(status + ' status batch processing completed successfully')
    //   }
    //   callback()
    // })
  })
}

//export
exports.processSingle = processSingle
