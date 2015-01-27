var fluentffmpeg = require('fluent-ffmpeg')
var job = require('./db.js')
var path = require('path')

var env = process.env.NODE_ENV || "development"
var config = require(__dirname + '/config.json')[env]

//instance of fluent-ffmpeg
var ffmpeg = fluentffmpeg();

/**
 * Common event handlers
 **/

ffmpeg.on('start', function(commandLine) {
    console.log('Command: ' + commandLine)
    job.updateStatus(j.id, 'processing')
})

ffmpeg.on('end', function(err, stdout, stderr) {
    if (err) {
        console.log('ERROR ' + err)
        job.updateStatus(j.id, 'error')
    } else {
        console.log('SUCCESS');
        //update status
        job.updateStatus(j.id, 'completed')
            //update bandwidth
        job.updateBandwidth(j.id, path.dirname(j.original_file_path))
    }
    console.log(stdout)
})

ffmpeg.on('progress', function(progress) {
    console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
    job.updateStatus(j.id, 'processing')
})

ffmpeg.on('error', function(err, stdout, stderr) {
    console.log(err);
    job.updateStatus(j.id, 'error')
    console.log(stdout)
})

/**
 * Encode video to mp4, webm and ogv format. Also generate thumbnails
 * output files are generated in same folder in which input file is present
 * @param - <job> object
 **/

exports.video = function(j) {
        var inFile = j.original_file_path
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))
            // console.log(outFile);

        var command = fluentffmpeg(inFile)

        .on('start', function(commandLine) {
            console.log('Command: ' + commandLine)
            job.updateStatus(j.id, 'processing')
        })

        .on('end', function(err, stdout, stderr) {
            if (err) {
                console.log('ERROR ' + err)
                job.updateStatus(j.id, 'error')
            } else {
                console.log('SUCCESS');
                //update status
                job.updateStatus(j.id, 'completed')
                //update bandwidth
                job.updateBandwidth(j.id, path.dirname(j.original_file_path))
            }
            // console.log(stdout)
        })

        .on('progress', function(progress) {
            console.log('Job #' + j.id + 'Processing: ' + progress.percent.toFixed(2) + '% done');
            // job.updateStatus(j.id, 'processing')
        })

        .on('error', function(err, stdout, stderr) {
            console.log(err);
            job.updateStatus(j.id, 'error')
            console.log(stdout)
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
                count: j.thumb_count,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //not needed
    } //end of video

/**
 * Encode audio to mp3 and ogg format.
 * output files are generated in same folder in which input file is present
 * @param - <job> object
 **/

exports.audio = function(j) {
        var inFile = j.original_file_path
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        var command = fluentffmpeg(inFile)

        .on('start', function(commandLine) {
            console.log('Command: ' + commandLine)
            job.updateStatus(j.id, 'processing')
        })

        .on('end', function(err, stdout, stderr) {
            if (err) {
                console.log('ERROR ' + err)
                job.updateStatus(j.id, 'error')
            } else {
                console.log('SUCCESS');
                //update status
                job.updateStatus(j.id, 'completed')
                //update bandwidth
                job.updateBandwidth(j.id, path.dirname(j.original_file_path))
            }
            // console.log(stdout)
        })

        .on('progress', function(progress) {
            console.log('Job #' + j.id + 'Processing: ' + progress.percent.toFixed(2) + '% done');
            // job.updateStatus(j.id, 'processing')
        })

        .on('error', function(err, stdout, stderr) {
            console.log(err);
            job.updateStatus(j.id, 'error')
            console.log(stdout)
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
 * @param - <job> object
 **/

exports.thumbnails = function(j) {
        var inFile = j.original_file_path
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        var command = fluentffmpeg(inFile)

        .on('start', function(commandLine) {
            console.log('Command: ' + commandLine)
            job.updateStatus(j.id, 'processing')
        })

        .on('end', function(err, stdout, stderr) {
            if (err) {
                console.log('ERROR ' + err)
                job.updateStatus(j.id, 'error')
            } else {
                console.log('SUCCESS');
                //update status
                job.updateStatus(j.id, 'completed')
                //update bandwidth
                job.updateBandwidth(j.id, path.dirname(j.original_file_path))
            }
            // console.log(stdout)
        })

        .on('progress', function(progress) {
            console.log('Job #' + j.id + 'Processing: ' + progress.percent.toFixed(2) + '% done');
            // job.updateStatus(j.id, 'processing')
        })

        .on('error', function(err, stdout, stderr) {
            console.log(err);
            job.updateStatus(j.id, 'error')
            console.log(stdout)
        })

        //take screenshots
        .screenshots({
                count: j.thumb_count,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //not needed actual work
    } //end of thumbnails
