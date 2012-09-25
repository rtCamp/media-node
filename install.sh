#!/bin/bash

# Check The Linux Distribution

uname -a | grep Ubuntu
if [ $? -eq 0 ]
then
	echo -e "\033[34m Ubuntu Detected... \e[0m"
	echo -e "\033[34m Fetching Ubuntu Installer Script... \e[0m"
	curl https://raw.github.com/rtCamp/media-node/master/setup/ubuntu.sh | sudo bash
fi
