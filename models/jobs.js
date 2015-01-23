"use strict";

module.exports = function(sequelize, DataTypes) {
    var Jobs = sequelize.define("Job", {
        original_file: DataTypes.STRING,
        transcoded_file: DataTypes.STRING,
        status: DataTypes.INTEGER,
        output_type: DataTypes.INTEGER,
        callback_url: DataTypes.TEXT,
        duration: DataTypes.INTEGER,
        thumbs: DataTypes.INTEGER
    });

    return Jobs;
};
