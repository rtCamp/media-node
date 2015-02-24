/**
    Queue Manager - a wrapper around encoder and database

    Usage:
    ======

    var queue = require('./queue.js');                             // create object

    queue.processBatch(job_status, callback)
    queue.processsSingle(job_id, callback)

**/

var db = require('./db.js')
var encoder = require('./encode.js');

/**
 * Encodes a single Job and updates database values for it.
 * Upon success, fires callbackUrl.
 * output files are generated in same folder in which input file is present
 * @param - job object
 * @param - callback
 **/

function processSingle(job, callback) {
        console.log('Starting encoding ' + job.id)
        switch (job.requestFormats) {
            case 'mp4':
                console.log('video #' + job.id)
                encoder.video(job.originalFilePath, job.thumbCount, function(status) {
                    console.log('New status for job # ' + job.id + ' is ' + status)
                })
                break
            case 'mp3':
                encoder.audio(job.originalFilePath, function(status) {
                    console.log('New status for job # ' + job.id + ' is ' + status)
                })
                break
            case 'thumbnails':
                encoder.thumbnails(job.originalFilePath, job.thumbCount, function(status) {
                    console.log('New status for job # ' + job.id + ' is ' + status)
                })
                break
            default:
                console.log('ERROR : requestFormats is not set for Job #' + job.id)
        } //end of switch
    } //end of encode

/**
 * Start Processing Encoding Job Queue
 * TODO
   ====
   1. Use async. May be https://github.com/caolan/async#queue
 **/

exports.processBatch = function(status, callback) {
    console.log('Starting batch processing for job queue')
    db.find('queued', function(jobs) {
            console.log('Found Jobs')
            jobs.forEach(
                processSingle(job)            )
    })
} //end of processQueue

exports.processSingle = processSingle
