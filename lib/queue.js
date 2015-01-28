var dbjob = require('./db.js')
var encode = require('./encode.js');
/**
 * Start Processing Encoding Job Queue
 **/

exports.process = function(callback) {
        console.log('Starting queue processing')
        dbjob.find('queued', function(jobs) {
            console.log("Found Jobs")
            // console.log(jobs)
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
                        callback(job)
                }
            })
        })
    } //end of processQueue

exports.encode = function(job, callback) {
        console.log('Starting encoding ' + job.id)
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
                callback(job)
        } //end of switch
    } //end of encode
