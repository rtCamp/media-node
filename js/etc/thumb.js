var fs = require('fs')
var path = require('path')

fs.readdir('../files/1422392732/',function(err,files){
    if(err) {
        console.log(err);
    }

    files.forEach(function(file){
        if(path.extname(file) === ".png")
            console.log(file)
    });
});
