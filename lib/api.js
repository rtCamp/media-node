/*********************************************************
api.rtcamp.com related functions
*********************************************************/

//require
var request = require('request')
var fs = require('fs')
var url = require('url')
var path = require('path')
    // var wait = require('wait.for')
    // var async = require('async')
var http = require('http')
    //
var dbjob = require('./db.js')
var util = require('./util.js')
var queue = require('./queue.js')
    //
var env = process.env.NODE_ENV || "development"
var config = require(__dirname + '/../config.json')[env]

/**
 * Fetch pendig jobs from ex: http://api.rtcamp.com/server/1/getjobs
 **/

exports.getjobs = function(callback) {
        request(config.apiserver + "/server/" + config.apiserverid + '/getjobs', function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var parsed = JSON.parse(body);
                    if (parsed.jobs) {
                        parsed.jobs.forEach(function(job) {
                            rtAddJobByURL(job, callback)
                        })
                    } else {
                        console.log("API has no pending jobs at the moment")
                    }
                } else {
                    console.log(error);
                }
            }) //end of request
    } //end of function getjobs

/**
 * Update a single field's value for given job_id
 * @param job_id - external/api job id
 * @param field_name - remote field name
 * @param field_value - remote field value
 **/

exports.updatejob = function(job_id, field_name, field_value, callback) {
        var apiurl = config.apiserver + "server/" + config.apiserverid + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value;

        console.log("HIT " + apiurl);

        request(apiurl, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    // console.log(body)
                    console.log(field_name + " updated with value " + field_value)
                    callback()
                } else {
                    console.log("Failed");
                    // console.log(error);
                    // console.log(response)
                }
            }) //end of request
    } //end of function updatejob

/**
 * Execute callback for given job id
 * @param job - <job> object
 **/

exports.callback = function(job) {
        output = {
            id: job.api_job_id,
            file_id: job.api_job_id,
            file_url: job.original_file_url,
            status: job.status,
            file_name: path.basename(job.original_file_path),
            file_path: job.original_file_path,
            apikey: job.api_key_id,
        }

        //thumbnail loop
        console.log("Opening Dir " + path.dirname(job.original_file_path))

        var files = fs.readdirSync(path.dirname(job.original_file_path));
        var i = 1;

        files.forEach(function(file) {
                if (path.extname(file) === ".png") {
                    output['thumb_' + i++] = path.dirname(job.original_file_path) + '/' + file
                }
            }) //end of inner loop
        console.log("Executing callback for job # " + job.id);
        console.log("CALLBACK OUTPUT BELOW");
        console.log(output);

        request.post({
                    url: config.apiserver + 'job/done/',
                    form: output,
                },
                function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        // console.log(response)
                        console.log("callback success")
                    } else {
                        console.log("callback failed")
                        console.log(error);
                    }
                } //end of function
            ) //end of request.post
    } //end of rtAPIFireCallback

/******************************************************
 INTERNAL FUNCTIONS
******************************************************/

/**
 * Add new job to database based on input file url
 **/

function rtAddJobByURL(job, callback) {
        console.log("START: Add job by URL called for Job # " + job.id)

        //set a local filename
        var filename = url.parse(job.input_file_url).pathname.split('/').pop();
        var filepath = config.folder + '/' + job.id + '/' + filename;

        // dir for this job files
        util.makedir(config.folder + '/' + job.id);

        //download file from url
        if (!fs.existsSync(filepath)) {
            var file = fs.createWriteStream(filepath);

            http.get(job.input_file_url, function(res) {
                    res.on('data', function(data) {
                        file.write(data);
                    }).on('end', function() {
                        file.end();
                        console.log('Downloaded ' + filepath);
                        dbjob.create({
                            api_job_id: job.id,
                            api_key_id: job.apikey_id,
                            original_file_path: filepath,
                            original_file_url: 'http://' + config.host + ':' + config.port + '/' + path.normalize(filepath),
                            request_formats: job.request_formats,
                            thumb_count: job.thumbs,
                            bandwidth: job.bandwidth,
                            callback_url: job.callback_url,
                        }, callback);
                    });
                }) //end of http.get
        } else {
            //save new job to database
            dbjob.create({
                api_job_id: job.id,
                api_key_id: job.apikey_id,
                original_file_path: filepath,
                original_file_url: 'http://' + config.host + ':' + config.port + '/' + path.normalize(filepath),
                request_formats: job.request_formats,
                thumb_count: job.thumbs,
                bandwidth: job.bandwidth,
                callback_url: job.callback_url,
            }, callback);
            console.log("END: File already exists for # " + job.id)
        }
    } //end of function rtAddJobByURL
