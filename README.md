ffmpeg-node
===========

A node.js wrapper for ffmpeg. Made for https://github.com/rtCamp/buddypress-media 

## API

> Note: Replace IP:PORT when running following commands

### Using CURL

* Status *

```
curl 127.0.0.1:1023/status
```

* Version *

```
curl 127.0.0.1:1023/version
```

* Upload End point *

```
curl 127.0.0.1:1023/upload -F "upload=@/path/to/video/file.ext" -F "callback_url=http://something/callback.php"
```

### Test using browser

* Upload Form - 127.0.0.1:1023
* Status - 127.0.0.1:1023/status
* Version - 127.0.0.1:1023/version
