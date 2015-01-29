var encode = require('../lib/encode-2.js')

// var job ={
//     id: '1',
//     original_file_path: '/Users/rahul286/Sites/media-node/tests/data/gaganam.mov',
//     thumb_count: 1
// }

var inFile = '/Users/rahul286/Sites/media-node/tests/data/gaganam.mov'
var thumb_count = 1

encode.video(inFile, 0 ,function(res){
    console.log("VIDEO " + res)
});

// encode.audio(inFile , function(res){
//     console.log("AUDIO " + res)
// });
//
// encode.thumbnails(inFile , 1 , function(res){
//     console.log("THUMBNAILS " + res)
// });
