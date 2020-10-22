# ⚠️ This project is achieved and replaced by https://rtmedia.io/transcoder/

__________________________________________

media-node
===========

A node.js wrapper for ffmpeg. Made for https://github.com/rtmediawp/rtmedia

<a href="https://rtcamp.com/?utm_source=github&utm_medium=readme" rel="nofollow"><img src="https://rtcamp.com/wp-content/uploads/2019/04/github-banner@2x.png" alt="Handcrafted Enterprise WordPress Solutions by rtCamp" /></a>

## Install

```
sudo apt-get install libcurl4-openssl-dev build-essential
sudo npm install -g node-gyp
npm install formidable connect sqlite3
```

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
