/**
    Utility functions

    Usage:
    ======

    var util = require('./util.js');                             // create object

    util.makedir(path_to_dir)                                   //crate directory, if not exist

**/

var fs = require('fs')

/**
 * Create a dir if not exists
 * @param dir directory path which need to be created (if not exist)
 */

exports.makedir = function(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}
