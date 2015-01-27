/*********************************************************
  Main Entry Point

  1. Define all API endpoints as express routes
  2. Seprate out ffmpeg related code. Move them to fluent-ffmpeg
  3. Make use of database (not queue - becasue data will keep on adding)

*********************************************************/


/*********************************************************
    node.js requires
*********************************************************/

var express = require('express'),
    fs = require('fs'),
    exec = require('exec'),
    formidable = require('formidable'),
    mv = require('mv'),
    path = require('path'),
    models = require("./models"),
    ffmpeg = require('fluent-ffmpeg');

// config
var env = process.env.NODE_ENV || "development",
    config = require('./config.json')[env];

// app
var app = express();
/**********************************************************
    express.js routes
**********************************************************/

// Homepage should show video-upload form
app.get('/', function(req, res) {
    res.send(
        '<form action="/upload" enctype="multipart/form-data" method="post">' +
        '<input type="text" name="callback_url"><br>' +
        '<input type="text" name="media_type"><br>' +
        '<input type="file" name="upload" multiple="multiple"><br>' +
        '<input type="submit" value="Upload">' +
        '</form>'
    );
})

// status check
app.get('/status', function(req, res) {
    res.send('All is well');
})

// version check
app.get('/version', function(req, res) {
    res.send('Working on v2');
})

// Upload video directly here
app.post('/upload', function(req, res) {
    rtHandleUpload(req, res)
})


/*********************************************************
    Store incoming upload request in local database
*********************************************************/

function rtHandleUpload(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        // console.log(files.upload.path);
        // console.log(files.upload.name);
        // TODO: sanitize files.upload.name before storing it in database
        var inFileName = config.folder + '/' + files.upload.name;
        console.log("Saving as " + inFileName)
        mv(files.upload.path, inFileName, {
            mkdirp: true
        }, function(err) {
            if (err) {
                console.log("ERROR" + err);
                res.status(500);
                res.json({
                    'success': false
                });
            } else {
                //save to database
                models.Job.create({
                    original_file: inFileName
                        //TODO: job-type support
                }).then(function(job) {
                    console.log("Saved new job with #ID = " + job.id);
                    rtProcessQueue();
                })
                res.status(200);
                res.json({
                    'success': true
                });
            }
        });
    });

}


/*********************************************************
Encoder

//mp4
ffmpeg -i input.ext -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -preset slower -crf 18 -vf "scale=trunc(in_w/2)*2:trunc(in_h/2)*2" output.mp4

//webm
ffmpeg -i input.ext -c:v libvpx -c:a libvorbis -pix_fmt yuv420p -quality good -b:v 2M -crf 5 -vf "scale=trunc(in_w/2)*2:trunc(in_h/2)*2" output.webm

//ogv
ffmpeg -i input.ext -q 5 -pix_fmt yuv420p -acodec libvorbis -vcodec libtheora output.ogv

//thumb
ffmpeg -i input.ext -vframes 1 -map 0:v:0 -vf "scale=100:100" thumbnail.png

//mp3
ffmpeg -i input.ext -acodec libmp3lame -q:a 0 -map 0:a:0 output.mp3

//ogg
ffmpeg -i input.ext -acodec libvorbis -q:a 10 -map 0:a:0 output.ogg

*********************************************************/
/*
1. Find all videos which are not encoded yet
2. For each one - run encoding
*/

function rtProcessQueue() {
        //Find all jobs with status 'queued'
        models.Job.findAll({
            where: {
                status: "queued"
            }
        }).success(function(jobs) {
            jobs.forEach(function(job) {
                console.log("processing " + job.id + job.original_file);
                rtEncodeVideo(job.original_file);
            })
        })
    } //end of processQueue

function rtEncodeVideo(inFile) {
    // make sure you set the correct path to your video file
    //mp4
    // html5video.run(inFile);
    var outFile = config.folder + '/' + path.basename(inFile, path.extname(inFile))
    console.log(outFile);

    // var mp4 = 'ffmpeg -i ' + inFile + ' -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -preset slower -crf 18 -vf "scale=trunc(in_w/2)*2:trunc(in_h/2)*2" ' + outFile + '.mp4'
    // console.log("Exec ff: " + mp4)

    // exec(mp4, function(err, out, code) {
    //     console.log('stdout: ' + out);
    //     console.log('stderr: ' + code);
    //     console.log('stderr: ' + err);
    //     if (err instanceof Error)
    //         console.log(err);
    //     process.stderr.write(err);
    //     process.stdout.write(out);
    //     process.exit(code);
    // });

    var proc = ffmpeg(inFile)
        //mp4
        .output(outFile +  '.mp4')
        .videoCodec('libx264')
        .outputOptions(
            '-profile:v', 'baseline',
            '-preset', 'slower',
            '-pix_fmt', 'yuv420p',
            '-crf', '18'
        )
        .videoFilters('scale=trunc(in_w/2)*2:trunc(in_h/2)*2')

        //webm
        .output(outFile +  '.webm')
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
        .output(outFile +  '.ogv')
        .videoCodec('libtheora')
        .audioCodec('libvorbis')
        .outputOptions(
            '-pix_fmt', 'yuv420p',
            '-q', '5'
        )

        .on('start', function(commandLine) {
            console.log('Command: ' + commandLine);
            //TODO: update database
        })
        .on('end', function(err, stdout, stderr) {
            if(err)
                console.log('ERROR ' + err )
            else
                console.log('SUCCESS');
            console.log(stdout)
            //TODO: update database
        })
        .on('progress', function(progress) {
            console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
        })
        .on('error', function(err) {
            console.log('ERROR ' + err);
            //TODO: update database
        })

        //take screenshots
        .screenshots({
            count: 5,   //TODO: accept via parameter
            folder: path.dirname(outFile),
            filename: '%b-%i.png'
        })
        // .run(); //start actual work

        // set custom option
        //

}

/*********************************************************
Make sure media folders are present before api takes over
*********************************************************/

function rtDirCheck() {
    //top-level media folder
    if (!fs.existsSync(config.folder)) {
        fs.mkdirSync(config.folder);
    }
}

/*********************************************************
    START Execution
*********************************************************/

models.sequelize.sync().then(function() {
    var server = app.listen(config.port, config.host, function() {
        var host = server.address().address
        var port = server.address().port
        console.log('Media-node is listening at http://%s:%s', host, port);
        rtDirCheck(); //make sure media storgae folders are present
        rtProcessQueue(); //start processing queue
    });
});
