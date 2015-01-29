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
