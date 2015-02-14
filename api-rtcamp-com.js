var dbjob = require('./app/db.js')
var api = require('./app/api.js')
var queue = require('./app/queue.js')
var util = require('./app/util.js')
var app = require('./media-node.js')

//config
var env = process.env.NODE_ENV || "development"
var config = require(__dirname + '/config.json')[env]

//make sure upload folder exist
util.makedir(config.folder);

function updatejobs() {
    dbjob.find('completed', function(jobs) {
        console.log("Found completed Jobs")
            // console.log(jobs)
        jobs.forEach(function(job) {
            //update bandwidth
            api.updatejob(job.api_job_id, 'bandwidth', job.bandwidth, function() {
                // update remote API
                api.updatejob(job.api_job_id, 'duration', job.duration, function() {
                    //update job status at API
                    api.updatejob(job.api_job_id, 'job_status', job.status, function() {
                        //update out_file_location
                        api.updatejob(job.api_job_id, 'out_file_location', job.original_file_url, function() {
                            api.updatejob(job.api_job_id, 'input_file_path', job.original_file_path, function() {
                                //fire callback
                                api.callback(job)
                            })
                        })
                    })
                })
            })
        })
    })
}

// new job to queue
app.get('/new', function(req, res) {
    startjobs()
    res.send('Will process new jobs right away!')
})

// fetch new jobs via API
function startjobs() {
        api.getjobs(function(res) {
            //process new jobs found in API
            console.log("===================================================")
            console.log("START processing queue")
            console.log("===================================================")
            queue.encode(res, function(job) {
                    //update bandwidth
                    api.updatejob(job.api_job_id, 'bandwidth', job.bandwidth, function() {
                        // update remote API
                        api.updatejob(job.api_job_id, 'duration', job.duration, function() {
                            //update job status at API
                            api.updatejob(job.api_job_id, 'job_status', job.status, function() {
                                //update out_file_location
                                api.updatejob(job.api_job_id, 'out_file_location', job.original_file_url, function() {
                                    api.updatejob(job.api_job_id, 'input_file_path', job.original_file_path, function() {
                                        //fire callback
                                        api.callback(job)
                                    })
                                })
                            })
                        })
                    })
                })
                // queue.process();
        })
    }
    //start server
var server = app.listen(config.port, config.host, function() {
    var host = server.address().address
    var port = server.address().port
    console.log('Media-node is listening at http://%s:%s', host, port);
    updatejobs()
        // startjobs()
});
