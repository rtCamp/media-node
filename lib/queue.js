var job = require('./db.js')
var encode = require('./encode.js');
/**
 * Start Processing Encoding Job Queue
 **/

exports.process = function(callback) {
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
                callback(job)
                }
            })
        })
    } //end of processQueue
