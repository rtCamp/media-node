/*********************************************************
    api.rtcamp.com related functions
*********************************************************/

//fetch pendig jobs
function rtAPIGetJobs() {
    var body = '';
    http.get(config.apiserver + 'getjobs', function(response) {
        // Continuously update stream with data
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            parsed.jobs.forEach(function(job) {
                //save to database
                rtAddJobByURL(job)
            })
            console.log(parsed); //json
        });
        response.on('error', function(err) {
            console.log("Error: " + err.message);
        });
    } //end of callback
) //end of http
rtProcessQueue(); //start processing local job queue
}

function rtAPIUpdateJob(job_id, field_name, field_value) {
    var req = httpsync.get(config.apiserver + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value);
    //req = http.get(server_url + "/server/" + server_id + "/update/" + job_id + "/?field_name=" + field_name + "&field_value=" + field_value, function(respo) {
    //console.log(job_id + " Updated : " + field_name + ' ---> ' + field_value)
    //})
    var res = req.end();
    console.log(res);
}

function rtAPIFireCallback(callback_url, output) {
    var callback = url.parse(server_callback);
    var out_text = JSON.stringify(data);
    var querystring = require('querystring');
    var data = querystring.stringify(output);
    var options = {
        host: callback.hostname,
        port: callback.port,
        path: callback.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    };
    console.log(options);

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            console.log('Servers reply on callback: ' + chunk);
        });
    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    console.log(out_text);
    req.write(data);
    req.end();
}

rtAPIUpdateJob(job.api_job_id, 'rtUpdateJobBandwidth', job.bandwidth);

//update remote API
rtAPIUpdateJob(job.api_job_id, 'duration', job.duration);

//update job status at API
rtAPIUpdateJob(job.api_job_id, 'job_status', job.status);

//update out_file_location
rtAPIUpdateJob(job.api_job_id, 'out_file_location', job.original_file_url)

/**
* Add new job to database based on input file url
**/

function rtAddJobByURL(job) {
    //get filesize
    var newJob = {
        api_job_id: ts,
        original_file_path: filename,
        original_file_url: 'http://' + config.host + ':' + config.port + '/' + filename,
        bandwidth: size
    };
    //create new job in DB
    job.create(newJob);

    //set a local filename
    var filename = url.parse(job.input_file_url).pathname.split('/').pop();
    var filepath = config.folder + '/' + job.id + '/' + filename;

    rtDirCheck(config.folder + '/' + job.id);

    //download file from url
    var file = fs.createWriteStream(filepath);

    http.get(job.input_file_url, function(res) {
        res.on('data', function(data) {
            file.write(data);
        }).on('end', function() {
            file.end();
            console.log('Downloaded ' + filepath);
        });
    });

    //save to database
    models.Job.create({
        api_job_id: job.id,
        original_file_path: filepath,
        original_file_url: 'http://' + config.host + ':' + config.port + '/' + path.normalize(filepath),
        request_formats: job.request_formats,
        thumb_count: job.thumbs,
        bandwidth: job.bandwidth,
        callback_url: job.callback_url,
        duration: rtGetDuration(filepath)
    }).then(function(job) {
        console.log("Saved new job with #ID = " + job.id);
    })

} //end of function
