var fluentffmpeg = require('fluent-ffmpeg')

var env = process.env.NODE_ENV || "development"

var config = require(__dirname + '/config.json')[env]

//instance of fluent-ffmpeg
var ffmpeg = fluentffmpeg();

/**
 * Common event handlers
 **/

ffmpeg.on('start', function(commandLine) {
    console.log('Command: ' + commandLine);
    rtUpdateJobStatus(job.id, 'processing');
})

ffmpeg.on('end', function(err, stdout, stderr) {
    if (err) {
        console.log('ERROR ' + err)
        rtUpdateJobStatus(job.id, 'error');
    } else {
        console.log('SUCCESS');
        rtUpdateJobStatus(job.id, 'succes');
    }
    console.log(stdout)
})

ffmpeg.on('progress', function(progress) {
    console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
    rtUpdateJobStatus(job.id, 'processing');
})

ffmpeg.on('error', function(err) {
    console.log('ERROR ' + err);
    rtUpdateJobStatus(job.id, 'error');
    console.log(stdout)
})

/**
 * Encode video to mp4, webm and ogv format. Also generate thumbnails
 * output files are generated in same folder in which input file is present
 * @param - <job> object
 **/

export.video = function(job) {
        var inFile = job.original_file_path
            // console.log(outFile);
        ffmpeg.input(inFile)

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
                count: job.thumb_count,
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

export.audio = function(job) {
        var inFile = job.original_file_path
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        ffmpeg.input(inFile)

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

export.thumbnails = function(job) {
        var inFile = job.original_file_path
        var outFile = path.dirname(inFile) + '/' + path.basename(inFile, path.extname(inFile))

        ffmpeg.input(inFile)

        //take screenshots
        .screenshots({
                count: job.thumb_count,
                folder: path.dirname(outFile),
                filename: '%b-%i.png'
            })
            // .run(); //not needed actual work
    } //end of thumbnails
