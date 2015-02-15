/**
    Queue Manager - a wrapper around encoder and database

    Usage:
    ======

    var queue = require('./queue.js');                             // create object

    queue.processBatch(job_status, callback)
    queue.processsSingle(job_id, callback)

**/

var db = require('./db.js')
var encoder = require('./encoder.js');

/**
 * Encodes a single Job and updates database values for it.
 * Upon success, fires callback_url.
 * output files are generated in same folder in which input file is present
 * @param - input_file_path
 * @param - callback
 **/

function processSingle (job, callback) {
        console.log('Starting encoding ' + job.id)
        switch (job.request_formats) {
            case 'mp4':
                console.log('video #' + job.id)
                encoder.video(job.original_file_path, function(status){
                    console.log("New status for job # " + job.id + " is " + status)
                })
                break
            case 'mp3':
                encoder.audio(job.original_file_path, function(status){
                    console.log("New status for job # " + job.id + " is " + status)
                })
                break
            case 'thumbnails':
                encoder.thumbnails(job.original_file_path, job.thumb_count, function(status){
                    console.log("New status for job # " + job.id + " is " + status)
                })
                break
            default:
                console.log("ERROR : request_formats is not set for Job #" + job.id)
        } //end of switch
    } //end of encode

/**
 * Start Processing Encoding Job Queue
 **/

exports.processBatch = function(status, callback) {
        console.log('Starting batch processing for job queue')
        db.find('queued', function(jobs) {
            console.log("Found Jobs")
            // console.log(jobs)
            jobs.forEach(
                processSingle(job)
            })
        })
    } //end of processQueue

exports.processSingle = processSingle
