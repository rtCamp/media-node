var job = require('../db.js');

var sampleJob = {};

sampleJob.api_job_id = 22
sampleJob.original_file_path = 'hello.jpg'
sampleJob.original_file_url = "wow"
sampleJob.request_formats = "mp3"
sampleJob.thumb_count = 5
sampleJob.bandwidth = 1312234
sampleJob.callback_url = "example.com/callback"
sampleJob.duration = 12

job.create(sampleJob);

job.find('queued', function(jobs){
    jobs.forEach(function(job){
        console.log(job.id + job.original_file_path);
    })
})

job.updateStatus(2,'completed')
// job.updateBandwidth(2,231345)
// job.updateDuration(2,4.5)

console.log("JOBBBBBBBSSSSS")
console.log(job)
