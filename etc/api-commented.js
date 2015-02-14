/*********************************************************
    api.rtcamp.com related functions
*********************************************************/

//require
var request = require('request')
var fs = require('fs')
var url = require('url')
var path = require('path')

var dbjob = require('./app/db.js')
var util = require('./app/util.js')

var env = process.env.NODE_ENV || "development"
var config = require(__dirname + '/config.json')[env]

//fetch pendig jobs
function rtAPIGetJobs() {
        request(config.apiserver + "/server/" + config.apiserverid + '/getjobs', function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var parsed = JSON.parse(body);
                    parsed.jobs.forEach(function(job) {
                        //save to database
                        rtAddJobByURL(job)
                        console.log(job)
                    })
                } else {
                    console.log(error);
                }
            }) //end of request
    } //end of function rtAPIGetJobs

function rtAPIUpdateJob(job_id, field_name, field_value) {
    request(config.apiserver + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value, function(error, response, body) {
        if (!error && response.statusCode == 200) {
                console.log(body)
            })
        } else {
            console.log(error);
        }
    }) //end of request

    // var req = httpsync.get(config.apiserver + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value);
    //req = http.get(server_url + "/server/" + server_id + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value, function(respo) {
    //console.log(job_id + " Updated : " + field_name + ' ---> ' + field_value)
    //})
}//end of rtAPIUpdateJob


function rtAPIFireCallback(job) {
    var output = {
        id: job.api_job_id,
        file_id: job.api_job_id,
        file_url: job.original_file_url,
        status: job.status,
        file_name: path.basename(job.original_file_path),
        file_path: job.original_file_path,
        apikey: job.api_key_id,
    }

    //thumbnail loop
    fs.readdir('path.dirname(job.original_file_path)', function(err, files) {
            if (err) {
                console.log(err);
            }
            var i = 1
            files.forEach(function(file) {
                    if (path.extname(file) === ".png") {
                        output['thumb_' + i++] = path.dirname(job.original_file_path) + file
                    }
                }) //end of inner loop
        }) //end readdir

    console.log(output)

    request.post({
            url: config.apiserver + '/job/done/',
            form: output,
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body)
                } else {
                    console.log(error);
                }
            }) //end of request
    })
} //end of rtAPIFireCallback

//
// rtAPIUpdateJob(job.api_job_id, 'rtUpdateJobBandwidth', job.bandwidth);
//
// //update remote API
// rtAPIUpdateJob(job.api_job_id, 'duration', job.duration);
//
// //update job status at API
// rtAPIUpdateJob(job.api_job_id, 'job_status', job.status);
//
// //update out_file_location
// rtAPIUpdateJob(job.api_job_id, 'out_file_location', job.original_file_url)
//
// /**
//  * Add new job to database based on input file url
//  **/
//
function rtDownloadFile(job_id, job_url) {
    console.log(job_id)
    console.log(job_url)
        //set a local filename
    var filename = url.parse(job_url).pathname.split('/').pop();
    var filepath = config.folder + '/' + job_id + '/' + filename;

    // dir for this job files
    util.makedir(config.folder + '/' + job_id);

    //download file from url
    var file = fs.createWriteStream(filepath);

    request(job_url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                file.write(body)
                file.end()
                console.log('Downloaded ' + filepath)
            } else {
                console.log(error)
            }
        }) //end of request

    // http.get(job.input_file_url, function(res) {
    //     res.on('data', function(data) {
    //         file.write(data);
    //     }).on('end', function() {
    //         file.end();
    //         console.log('Downloaded ' + filepath);
    //     });
    // });

    return filepath;
}

function rtAddJobByURL(job) {
        var filepath = rtDownloadFile(job.id, job.input_file_url)
            // //get filesize
            // var newJob = {
            //     api_job_id: job.id,
            //     api_key_id: job.apikey_id,
            //     original_file_url: 'http://' + config.host + ':' + config.port + '/' + filename,
            //     bandwidth: size
            // };
            // //create new job in DB
            // job.create(newJob);

        //save new job to database
        var newJob = {
            api_job_id: job.id,
            api_key_id: job.apikey_id,
            original_file_path: filepath,
            original_file_url: 'http://' + config.host + ':' + config.port + '/' + path.normalize(filepath),
            request_formats: job.request_formats,
            thumb_count: job.thumbs,
            bandwidth: job.bandwidth,
            callback_url: job.callback_url,
        };

        dbjob.create(newJob)
    } //end of function

//fetch API
rtAPIGetJobs()


/**
* Download file by from a URL and return local path
**/

// function rtDownloadFile(job_id, job_url) {
//     console.log("START: Download File for Job # " + job_id + " from " +  job_url )
//
//     //set a local filename
//     var filename = url.parse(job_url).pathname.split('/').pop();
//     var filepath = config.folder + '/' + job_id + '/' + filename;
//
//     // dir for this job files
//     util.makedir(config.folder + '/' + job_id);
//
//     //download file from url
//     var file = fs.createWriteStream(filepath);
//
//     request(job_url, function(error, response, body) {
//         if (!error && response.statusCode == 200) {
//             file.write(body)
//             file.end()
//             console.log('Downloaded ' + filepath)
//         } else {
//             console.log(error)
//         }
//     }) //end of request
//
//     console.log("END: Download File for Job # " + job_id + " to " +  filepath )
//     return filepath;
// }
