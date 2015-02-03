/*********************************************************
  Main App
*********************************************************/

/**
 * node.js requires
 **/

var express = require('express')
var fs = require('fs')
var url = require('url')
var path = require('path')
var http = require("http")

//local modules
var job = require('./db.js');
var encode = require('./encode.js');
var util = require('./util.js');
var queue = require('./queue.js');

// config
var env = process.env.NODE_ENV || "development";
var config = require('./../config.json')[env];

/**********************************************************
    express.js routes
**********************************************************/
// express app
var app = module.exports = express(); //now media-node.js can be required to bring app into any file

// static files
// console.log("Files in dir " + path.dirname(__dirname) + '/files')
app.use(express.static('/files', path.dirname(__dirname) + '/files'));
app.use(express.static(path.dirname(__dirname) + '/'));


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
