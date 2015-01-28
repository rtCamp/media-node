var Sequelize = require('sequelize')
var path = require('path')
var fs = require('fs')
var du = require('du')
var fluentffmpeg = require('fluent-ffmpeg')

var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/../config.json')[env];

var sequelize = new Sequelize(config.database, config.username, config.password, config)

sequelize
    .authenticate()
    .complete(function(err) {
        if (!!err) {
            console.log('Unable to connect to the database:', err)
        } else {
            console.log('Connection has been established successfully.')
        }
    })

var Job = sequelize.define("Job", {
    api_job_id: {
        type: Sequelize.INTEGER,
        defaultValue: Math.floor(new Date() / 1000) //unix timestamp
    },
    api_key_id: Sequelize.INTEGER,
    original_file_path: Sequelize.STRING,
    original_file_url: Sequelize.STRING,
    request_formats: { //mp4, mp3 and thumbnails
        type: Sequelize.ENUM('mp4', 'mp3', 'thumbnails'),
        defaultValue: 'mp4'
    },
    status: { // queued, completed, processing, error
        type: Sequelize.ENUM('queued', 'completed', 'processing', 'error'),
        defaultValue: 'queued'
    },
    bandwidth: Sequelize.INTEGER,
    thumb_count: {
        type: Sequelize.INTEGER,
        defaultValue: 5
    },
    callback_url: Sequelize.TEXT,
    duration: Sequelize.FLOAT
});

sequelize
    .sync()
    .complete(function(err) {
        if (!!err) {
            console.log('An error occurred while creating the table:', err)
        } else {
            console.log('It worked!')
        }
    })

/**
 * Create a new job entry in database
 * @param job object
 * @param job.api_job_id external api's job_id. Blank for local
 * @param job.original_file_path filesystem path for original video file
 * @param job.original_file_url HTTP URL path for original video file
 * @param job.request_formats mp4, mp3 or thumbnails
 * @param job.thumb_count number of thumbnails needed
 * @param job.bandwidth total storage space needed for all incoming and outgoing files including thumbnails
 * @param job.callback_url external url to call when processing is completed
 * @param job.duration original video/audio duration
 **/

exports.create = function(job) {
        //get file size
        if (typeof job.bandwidth === 'undefined') {
            var stats = fs.statSync(job.original_file_path);
            job.bandwidth = stats.size;
            newjob.bandwidth = stats.size;
        }

        //check duration
        if (typeof job.duration === 'undefined') {
            fluentffmpeg(job.original_file_path)
                .ffprobe(function(err, data) {
                    if (err) {
                        console.log(err)
                        job.duration = 0
                    } else {
                        job.duration = data.format.duration
                    }
                    // console.log("Job duration is " + job.duration)
                    Job.create(job)
                    .then(
                        function(job) {
                            console.log("Saved new job with #ID = " + job.id);
                        })
                })
        } else {
            Job.create(job)
                .then(
                    function(job) {
                        console.log("Saved new job with #ID = " + job.id);
                    })
        }
    } //end of create

/**
 * Return all jobs with a particular status
 * @param job_status a valid status type
 * @param callback function to excute with results
 **/

exports.find = function(job_status, callback) {
        Job.findAll({
                where: {
                    status: job_status
                }
            })
            .then(
                function(jobs) {
                    callback(jobs)
                }
            )
    } //end of find

/**
 * Update a job's status
 * @param job_id job id which needs update
 * @param job_status new status
 **/

exports.updateStatus = function(job_id, job_status) {
        Job.update({
                status: job_status
            }, {
                where: {
                    id: job_id
                }
            })
            .then(function() {
                console.log("Status updated successfully for job #" + job_id);
            })
            .catch(function(err) {
                console.log("Status update failed for job #" + job_id);
            })
    } // end of upateStatus

/**
 * Update a job's bandwidth usage
 * @param job_id job id which needs update
 * @param job_bandwidth bandwidth used by this job
 **/

exports.updateBandwidth = function(job_id, job_dir) {
        console.log('Calculating the size of' + job_dir)
        du(job_dir, function(err, size) {
            console.log('The size of' + job_dir + ' is:', size, 'bytes')
            Job.update({
                    bandwidth: size
                }, {
                    where: {
                        id: job_id
                    }
                })
                .then(function() {
                    console.log("Bandwidth updated successfully for job #" + job_id);
                    console.log("Bandwidth update failed for job #" + job_id);
                })
        })

    } // end of upateBandwidth


/**
 * Update a job's duration (time)
 * @param job_id job id which needs update
 * @param job_duration duration
 **/

exports.updateDuration = function(job_id, job_file) {
        fluentffmpeg(job_file)
            .ffprobe(function(err, data) {
                if (err) {
                    console.log(err)
                } else {
                    Job.update({
                            duration: data.format.duration
                        }, {
                            where: {
                                id: job_id
                            }
                        })
                        .then(function() {
                            console.log("Duration updated successfully for job #" + job_id);
                        })
                        .catch(function(err) {
                            console.log("Duration update failed for job #" + job_id);
                        })
                }
            });

    } // end of upateBandwidth
