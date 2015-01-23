/*
 * Entry Point
 */

/*
    TODO:
    1. Define all API endpoints with dummy responses
    2. Seprate out config from code
    3. Seprate out ffmpeg related code. Move them to fluent-ffmpeg
    4. Make use of database (not queue - becasue data will keep on adding)
*/

var express = require('express')
var formidable = require('formidable')
var app = express()
var models = require("./models")

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
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        console.log(err)
        console.log(fields)
        console.log(files)
    })
    res.send('Upload sucees')
})

app.set('port', process.env.PORT || 3000);

//database
models.sequelize.sync().then(function () {
    var server = app.listen(app.get('port'), function() {
            var host = server.address().address
            var port = server.address().port
            console.log('Example app listening at http://%s:%s', host, port)
    });
});

// // start media-node server
// var server = app.listen(3000, function() {
//     var host = server.address().address
//     var port = server.address().port
//     console.log('Example app listening at http://%s:%s', host, port)
// })
