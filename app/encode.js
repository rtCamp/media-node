/**
    encoder module - ffmpeg wrapper

    Usage:
    ======

    var encoder = require('./encode.js');                           // create object

    encoder.video(input_file_path, thumbCount, callback)           // update status for a job
    encoder.audio(input_file_path, callback)                        // update bandwidth for a job
    encoder.thumbnails(input_file_path, thumbCount, callback)      // update duration for a job

    TODO
    =======
    1. Add formats to audio & video
    2. Add resolutions to thumbnails & video
**/

/**
 * node.js requires
 **/
var fluentffmpeg = require('fluent-ffmpeg')
var path = require('path')

//config
var env = process.env.NODE_ENV || 'development'
var config = require(__dirname + '/../config.json')[env]

//instance of fluent-ffmpeg
var ffmpeg = fluentffmpeg();

/**
 * Encode video to mp4, webm and ogv format. Also generate thumbnails
 * output files are generated in same folder in which input file is present
 * @param - input_file_path
 * @param - callback
 **/

exports.video = function(inFile, thumbCount, callback) {
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        console.log('Tyring to encode video # ' + inFile);
        console.log(inFile);
        console.log(outFile);

        var command = fluentffmpeg(inFile)

        .on('start', function(commandLine) {
            console.log('Command: ' + commandLine)
            callback('processing');
        })

        .on('end', function(err, stdout, stderr) {
            if (err) {
                console.log('ERROR ' + err)
                callback('error');
            } else {
                console.log('SUCCESS');
                callback('success');
            }
        })

        .on('progress', function(progress) {
            console.log('Job #' + inFile + '\n Processing: ' + progress.percent.toFixed(2) + '% done');
            callback('processing');
        })

        .on('error', function(err, stdout, stderr) {
            console.log('ERROR for job #' + inFile);
            console.log(err);
            callback('error');
        })

        //mp4
        .output(outFile + '.mp4')
            .videoCodec('libx264')
            .outputOptions(
                '-profile:v', 'baseline',
                '-preset', 'slower',
                '-pix_fmt', 'yuv420p',
                '-crf', '18'
            )
            .videoFilters('scale=trunc(in_w/2)*2:trunc(in_h/2)*2')

        //webm
        .output(outFile + '.webm')
            .videoCodec('libvpx')
            .audioCodec('libvorbis')
            .outputOptions(
                '-b:v', '2M',
                '-quality', 'good',
                '-pix_fmt', 'yuv420p',
                '-crf', '5'
            )
            .videoFilters('scale=trunc(in_w/2)*2:trunc(in_h/2)*2')

        //ogv
        .output(outFile + '.ogv')
            .videoCodec('libtheora')
            .audioCodec('libvorbis')
            .outputOptions(
                '-pix_fmt', 'yuv420p',
                '-q', '5'
            )

        //take screenshots
        .screenshots({
                count: thumbCount,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //not needed
    } //end of video

/**
 * Encode audio to mp3 and ogg format.
 * output files are generated in same folder in which input file is present
 * @param - input_file_path
 * @param - callback
 **/

exports.audio = function(inFile, callback) {
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        var command = fluentffmpeg(inFile)

        .on('start', function(commandLine) {
            console.log('Command: ' + commandLine)
            callback('processing');
        })

        .on('end', function(err, stdout, stderr) {
            if (err) {
                console.log('ERROR ' + err)
                callback('error');
            } else {
                console.log('SUCCESS');
                callback('success');
            }
        })

        .on('progress', function(progress) {
            console.log('Job #' + inFile + '\n Processing: ' + progress.percent.toFixed(2) + '% done');
            callback('processing');
        })

        .on('error', function(err, stdout, stderr) {
            console.log('ERROR for job #' + inFile);
            console.log(err);
            callback('error');
        })


        //mp3
        .output(outFile + '.mp3')
            .audioCodec('libmp3lame')
            .outputOptions(
                '-q:a', '0',
                '-map', '0:a:0'
            )

        //ogg
        .output(outFile + '.ogv')
            .audioCodec('libvorbis')
            .outputOptions(
                '-q:a', '0',
                '-map', '0:a:0'
            )

        .run(); //start actual work
    } //end of audio

/**
 * Generate thumbnails
 * output files are generated in same folder in which input file is present
 * @param - input_file_path
 * @param - callback
 **/

exports.thumbnails = function(inFile, thumbCount, callback) {
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        var command = fluentffmpeg(inFile)

        .on('start', function(commandLine) {
            console.log('Command: ' + commandLine)
            callback('processing');
        })

        .on('end', function(err, stdout, stderr) {
            if (err) {
                console.log('ERROR ' + err)
                callback('error');
            } else {
                console.log('SUCCESS');
                callback('success');
            }
        })

        .on('progress', function(progress) {
            console.log('Job #' + inFile + '\n Processing: ' + progress.percent.toFixed(2) + '% done');
            callback('processing');
        })

        .on('error', function(err, stdout, stderr) {
            console.log('ERROR for job #' + inFile);
            console.log(err);
            callback('error');
        })

        //take screenshots
        .screenshots({
                count: thumbCount,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //not needed actual work
    } //end of thumbnails
