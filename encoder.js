/*
    Encoding logic here
    1. Find all videos which are not encoded yet
    2. For each one - run encoding
*/

function processQueue(){
    //Find all jobs with status 'queued'
    models.Job.findAll({
        where: {
            status: "queued"
        }
    }).success(job){
        console.log("job #id " . job.id);
    }
}
function encode(file){

}
