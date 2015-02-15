/**
    express rooutes

    Usage:
    ======

    var app = require('./app.js');                  // create object

    // app is express app. All express function are available on app
**/

/**
 * node.js requires
 **/
var express = require('express')
var path = require('path')

// config
var env = process.env.NODE_ENV || "development";
var config = require('./../config.json')[env];

/**********************************************************
    express.js routes
**********************************************************/
// express app
var app = module.exports = express(); //now media-node.js can be required to bring app into any file

// static files
app.use(express.static('/files', path.dirname(__dirname) + '/files'));
app.use(express.static(path.dirname(__dirname) + '/'));


// Homepage should show video-upload form
app.get('/', function(req, res) {
    res.sendFile(path.dirname(__dirname) + '/app/form.html');
})

// status check
app.get('/status', function(req, res) {
    res.send('All is well');
})

// version check
app.get('/version', function(req, res) {
    res.send('Working on v2');
})
