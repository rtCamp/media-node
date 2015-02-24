var fluentffmpeg = require('fluent-ffmpeg')
// var job = require('./db.js')
var clone = require('clone');
var path = require('path')
var env = process.env.NODE_ENV || 'development'
var config = require(__dirname + '/../config.json')[env]

//instance of fluent-ffmpeg
var ffmpeg = fluentffmpeg();
/**
 * Common event handlers
 **/

ffmpeg.on('start', function(commandLine) {
    // console.log(this)
    console.log('FFMPEG Command: ' + commandLine)
    ffmpeg.cb('Started ' + this._inputs[0].source)
})

.on('end', function(err, stdout, stderr) {
    if (err) {
        console.log('ERROR ' + err)
        ffmpeg.cb('Error on ' + this._inputs[0].source)
    } else {
        console.log('SUCCESS');
        ffmpeg.cb('Fnished successfully  ' + this._inputs[0].source)
    }
})

.on('progress', function(progress) {
    console.log('Job Processing: ' + progress.percent.toFixed(2) + '% done for ' + this._inputs[0].source);
    ffmpeg.cb('Processing ' + this._inputs[0].source)
})

.on('error', function(err, stdout, stderr) {
    console.log('ERROR occured when trying to encode video');
    console.log(err);
    ffmpeg.cb('Error on ' + this._inputs[0].source)
})

/**
 * Encode video to mp4, webm and ogv format. Also generate thumbnails
 * output files are generated in same folder in which input file is present
 * @param - inFile local filesystem path for file to be processed
 * @param - thumbCount number of thumbnails to generate. If not specifed, no thumbanils are generated.
 * @param - callback function to call with different statues
 **/

exports.video = function(inFile, thumbCount, callback) {
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        console.log('Tyring to encode video @ ' + inFile);
        console.log(outFile);

        // var command = fluentffmpeg(inFile)
        var command = clone(ffmpeg);
        command.cb = callback;

        // build command
        command.input(inFile)

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

        if (typeof thumbCount === 'undefined' || thumbCount == 0) {
            command.run() //start
        } else {
            //take screenshots
            command.screenshots({
                count: thumbCount,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
        }
    } //end of video

/**
 * Encode audio to mp3 and ogg format.
 * output files are generated in same folder in which input file is present
 * @param - inFile local filesystem path for file to be processed
 * @param - callback function to call with different statues
 **/


exports.audio = function(inFile, callback) {
        // var inFile = j.originalFilePath
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        var command = ffmpeg;
        command.cb = callback;

        // build command

        command.input(inFile)

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
 * @param - inFile local filesystem path for file to be processed
 * @param - thumbCount number of thumbnails to generate. Default is 1
 * @param - callback function to call with different statues
 **/

exports.thumbnails = function(inFile, thumbCount, callback) {
        // var inFile = j.originalFilePath
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        var command = ffmpeg;
        command.cb = callback;

        // build command

        command.input(inFile)

        //take screenshots
        .screenshots({
                count: thumbCount,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //not needed actual work
    } //end of thumbnails
