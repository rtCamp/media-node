/**
    Database module

    Usage:
    ======

    var db = require('./db.js');                    // create object

    db.init(callback)                               // initialize db and create tables if not exist
    db.find(status, callback)                       // find jobs with status
    db.create(job, callback)                        // find jobs with status
    db.updateStatus(jobId, new_status, callback)   // update status for a job
    db.updateBandwidth(jobId, bandwidth, callback) // update bandwidth for a job
    db.updateDuration(jobId, duration, callback)   // update duration for a job

**/

var Sequelize = require('sequelize')
var path = require('path')
var fs = require('fs')
var du = require('du')
var fluentffmpeg = require('fluent-ffmpeg')

var env = process.env.NODE_ENV || 'development';
var config = require(__dirname + '/../config.json')[env];

// create sequelize ORM ibject
var sequelize = new Sequelize(config.database, config.username, config.password, config)

// create JOB object (table schema)
var Job = sequelize.define('Job', {
  apiJobId: {
    type: Sequelize.INTEGER,
    defaultValue: Math.floor(new Date() / 1000) //unix timestamp
  },
  apiKeyId: Sequelize.INTEGER,
  originalFilePath: Sequelize.STRING,
  originalFileUrl: Sequelize.STRING,
  requestFormats: {
    type: Sequelize.ENUM('mp4', 'mp3', 'thumbnails'),
    defaultValue: 'mp4'
  },
  status: {
    type: Sequelize.ENUM('queued', 'completed', 'processing', 'error'),
    defaultValue: 'queued'
  },
  bandwidth: Sequelize.INTEGER,
  thumbCount: {
    type: Sequelize.INTEGER,
    defaultValue: 5
  },
  callbackUrl: Sequelize.TEXT,
  duration: Sequelize.FLOAT
});

/**
 * Initialize database. This will create database tables if they don't exist.
 * @param callback
 **/

exports.init = function(callback) {
  sequelize
    .sync()
    .then(function() {
      console.log('Database table ready!')
      callback()
    })
}

/**
 * Create a new job entry in database
 * @param job object
 * @param job.apiJobId external api's jobId. Blank for local
 * @param job.originalFilePath filesystem path for original video file
 * @param job.originalFileUrl HTTP URL path for original video file
 * @param job.requestFormats mp4, mp3 or thumbnails
 * @param job.thumbCount number of thumbnails needed
 * @param job.bandwidth total storage space needed for all incoming and outgoing files including thumbnails
 * @param job.callbackUrl external url to call when processing is completed
 * @param job.duration original video/audio duration
 **/

exports.create = function(job, callback) {
    //get file size
    if (typeof job.bandwidth === 'undefined') {
      var stats = fs.statSync(job.originalFilePath);
      job.bandwidth = stats.size;
    }

    //check duration
    if (typeof job.duration === 'undefined') {
      fluentffmpeg(job.originalFilePath)
        .ffprobe(function(err, data) {
          if (err) {
            console.log('ffprobe coudln\'t find correct duration so setting it to 0 (zero) ')
            job.duration = 0
          } else {
            job.duration = data.format.duration
          }
          // console.log('Job duration is ' + job.duration)
          Job.create(job)
            .then(
              function(res) {
                // console.log(res)
                console.log('Saved new job with #ID = ' + res.id);
                callback(res)
              })
        })
    } else {
      Job.create(job)
        .then(
          function(res) {
            // console.log(res)
            console.log('Saved new job with #ID = ' + res.id);
            callback(res)
          })
    }
  } //end of create

/**
 * find - Find all jobs with a particular status
 *
 * @param  {string}     jobStatus      a valid status type
 * @param  {function}   callback       function to excute with database search results
 */
exports.find = function(jobStatus, callback) {
    if (typeof jobStatus === 'undefined') {
      jobStatus = 'queued'
    }
    console.log('Inside db.find :: Trying to find jobs with status : ' + jobStatus)
    Job.findAll({
        where: {
          status: jobStatus
        }
      })
      .then(
        function(jobs) {
          // console.log(jobs)
          console.log('Inside db.find :: Found ' + jobs.length + 'for status = ' + jobStatus)
          callback(jobs)
        }
      ).catch(function(error) {
        console.log('Inside db.find :: Following ERROR occured')
        console.log(error)
      })
  } //end of find

/**
 * Update a job's status
 * @param jobId job id which needs update
 * @param jobStatus new status
 **/

/**
 * updateStatusForJob - Update a job's status
 *
 * @param  {integer}    jobId           description
 * @param  {string}     jobStatus       jobId job id which needs update
 * @param  {function}   callback        function to excute with database search results
 */
exports.updateStatus = function updateStatusForJob(jobId, jobStatus) {
    Job.update({
        status: jobStatus
      }, {
        where: {
          id: jobId
        }
      })
      .then(function() {
        console.log('Status updated successfully for job #' + jobId + ' with new status ' + jobStatus);
        // callback(jobId, jobStatus)
      })
      .catch(function(err) {
        console.log('Status update failed for job #' + jobId + ' with new status ' + jobStatus);
      })
  } // end of upateStatus

/**
 * Update a job's bandwidth usage
 * @param jobId job id which needs update
 * @param job_bandwidth bandwidth in bytes used by this job
 **/

exports.updateBandwidth = function(jobId, job_dir, callback) {
    console.log('Calculating the size of' + job_dir)
    du(job_dir, function(err, size) {
      console.log('The size of' + job_dir + ' is:', size, 'bytes')
      Job.update({
          bandwidth: size
        }, {
          where: {
            id: jobId
          }
        })
        .then(function() {
          console.log('Bandwidth updated successfully for job #' + jobId);
          callback()
        })
    })

  } // end of upateBandwidth


/**
 * Update a job's duration (time)
 * @param jobId job id which needs update
 * @param job_duration duration in seconds
 **/

exports.updateDuration = function(jobId, job_file, callback) {
    fluentffmpeg(job_file)
      .ffprobe(function(err, data) {
        if (err) {
          console.log(err)
        } else {
          Job.update({
              duration: data.format.duration
            }, {
              where: {
                id: jobId
              }
            })
            .then(function() {
              console.log('Duration updated successfully for job #' + jobId);
              callback()
            })
            .catch(function(err) {
              console.log('Duration update failed for job #' + jobId);
            })
        }
      });

  } // end of upateBandwidth
