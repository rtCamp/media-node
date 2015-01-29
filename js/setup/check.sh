#!/bin/bash
cd /root/media-node
curl -F "upload=@file.mp4;callback_url=http://localhost/;media_type='video';duration='120';thumbs=1" http://localhost:1203/upload
ffmpeg -i ./file.mp4 -loglevel verbose -r 24 -vcodec libx264 -vprofile high -preset slow -vf scale=640:480 -b:v 1500k -maxrate 100k -bufsize 200k -threads 1 -acodec libfaac -b:a 128k "./temp/file.mp4"
