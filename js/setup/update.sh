#!/bin/bash

if [ -d /root/media-node/.git ]
then

        # Update The Code Through Git Pull
        echo ".Git Already Exist..."

        cd /root/media-node
	
	echo "Execute Git Pull Request..."
        git pull

        # Restart Media Node
	echo "Restarting Media Node..."
        PIDOFNODE=$(pgrep node)
        echo $PIDOFNODE
        kill -9 $PIDOFNODE
        cd /root/media-node && node ffmpeg_server.js >> /var/log/ffmpeg_server.log &


else
        # Fix Git Pull Issue
        echo ".Git Not Found..."

        cd /tmp
	echo "Clonning Media Node Repository..."
        git clone git://github.com/rtCamp/media-node.git
        cp -av media-node/* /root/media-node/
        cp -av media-node/.* /root/media-node/

        # Restart Media Node
	echo "Restarting Media Node..."
        PIDOFNODE=$(pgrep node)
        echo $PIDOFNODE
        kill -9 $PIDOFNODE
        cd /root/media-node && node ffmpeg_server.js >> /var/log/ffmpeg_server.log &
fi
