media-node
===========

## Notes

Incoming file: sample.mov
create videos: sample.mp4, sample.webm, sample.ogv
and thumbnail: sample-1.jpg, sample-2.jpg, etc


A node.js wrapper for ffmpeg. Made for https://github.com/rtCamp/buddypress-media

## API

> Note: Replace IP:PORT when running following commands

### Using CURL

**Status**

```
curl 127.0.0.1:1023/status
```

**Version**

```
curl 127.0.0.1:1023/version
```

**Upload End point**

```
curl 127.0.0.1:1023/upload -F "upload=@/path/to/video/file.ext" -F "callback_url=http://something/callback.php"
```

### Test using browser

**URLs**

* Upload Form - 127.0.0.1:1023/
* Status - 127.0.0.1:1023/status
* Version - 127.0.0.1:1023/version

**Nginx Proxy**

If you are running media-node on 127.0.0.1 on remote server, then you should create a proxy site redirect traffic from local server to media-node during testing.

FFMPEG Commands used
=====================

* source: https://blog.mediacru.sh/2013/12/23/The-right-way-to-encode-HTML5-video.html * 

### mp4
```
ffmpeg -i input.ext -vcodec libx264 -pix_fmt yuv420p -profile:v baseline -preset slower -crf 18 -vf "scale=trunc(in_w/2)*2:trunc(in_h/2)*2" output.mp4
```

### webm
```
ffmpeg -i input.ext -c:v libvpx -c:a libvorbis -pix_fmt yuv420p -quality good -b:v 2M -crf 5 -vf "scale=trunc(in_w/2)*2:trunc(in_h/2)*2" output.webm
```

### ogv
```
ffmpeg -i input.ext -q 5 -pix_fmt yuv420p -acodec libvorbis -vcodec libtheora output.ogv
```

### thumb
```
ffmpeg -i input.ext -vframes 1 -map 0:v:0 -vf "scale=100:100" thumbnail.png
```

### mp3
```
ffmpeg -i input.ext -acodec libmp3lame -q:a 0 -map 0:a:0 output.mp3
```

### ogg
```
ffmpeg -i input.ext -acodec libvorbis -q:a 10 -map 0:a:0 output.ogg
```
