API get jobs
================================================

```
{ id: 7855,
    apikey_id: 130,
    end_time: null,
    input_file_path: null,
    input_file_url: 'http://demo.rtcamp.com/rtmedia/wp-content/uploads/rtMedia/users/1/2015/01/ArtjazH264_xvid-1.avi',
    job_status: 'queue',
    out_file_location: null,
    request_formats: 'mp4',
    request_time: '2015-01-28T08:12:08Z',
    server_id: 1,
    start_time: null,
    user_id: 118,
    bandwidth: 2136800,
    callback_url: 'http://demo.rtcamp.com/rtmedia/index.php',
    download_id: 'afe16765fb4bf8b8970ca76ea5a7b620cc863682b83d6c5d',
    thumbs: 2 }
{ id: 7856,
    apikey_id: 3603,
    end_time: null,
    input_file_path: null,
    input_file_url: 'http://togosocial.com/wp-content/uploads/rtMedia/users/5109/2015/01/10528321_676803699073408_841903502_n.mp4',
    job_status: 'queue',
    out_file_location: null,
    request_formats: 'thumbnails',
    request_time: '2015-01-28T09:31:31Z',
    server_id: 1,
    start_time: null,
    user_id: 3580,
    bandwidth: 16532100,
    callback_url: 'http://togosocial.com/index.php',
    download_id: '68335ac30e8e81f7d2d814ed4d7c53e002664b3a1edb3119',
    thumbs: 2 }
```


API Callback POST sample
================================

```
{ host: 'api.rtcamp.com',
port: null,
path: '/job/done/',
method: 'POST',
headers:
{ 'Content-Type': 'application/x-www-form-urlencoded',
'Content-Length': 545 } }
{   id: 7854,
    file_id: 7854,
    file_url: 'http://192.99.10.169:1122/7854/ArtjazH264_xvid-1.mp4',
    status: 'completed',
    file_name: 'ArtjazH264_xvid-1.mp4',
    file_path: './data/completed/7854/ArtjazH264_xvid-1.mp4',
    apikey: 130,
    thumb_2: '7854/thumbs/ArtjazH264_xvid-11.jpg',
    thumb_3: '7854/thumbs/ArtjazH264_xvid-12.jpg',
    thumb_4: '7854/thumbs/ArtjazH264_xvid-13.jpg',
    thumb_5: '7854/thumbs/ArtjazH264_xvid-14.jpg',
    thumb_6: '7854/thumbs/ArtjazH264_xvid-15.jpg',
    thumb_7: '7854/thumbs/ArtjazH264_xvid-16.jpg',
    thumb_8: '7854/thumbs/ArtjazH264_xvid-17.jpg'
}
```
