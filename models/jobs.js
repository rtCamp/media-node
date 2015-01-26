"use strict";

/**
* Status Codes:
queued      - File has been successfully recieved
processing  - File is being transcoded
success     - File is transcoded successfully and is ready for download
error       - There was an error in transcoding

following not used
* 4:	Delete - The file was removed by the server
* 6:	There was an error in uploading
* 7:	There was an error moving the transcoded file
* 8:	The file type is not supported
* 9:	The file was encoded but the callback failed
**/

module.exports = function(sequelize, DataTypes) {
    var Jobs = sequelize.define("Job", {
        original_file       :   DataTypes.STRING,
        transcoded_file     :   DataTypes.STRING,
        status              : { type: DataTypes.STRING, defaultValue: 'queued'},
        output_type         :   DataTypes.INTEGER,
        callback_url        :   DataTypes.TEXT,
        duration            :   DataTypes.INTEGER,
        thumbs              :   DataTypes.INTEGER
    });

    return Jobs;
};
