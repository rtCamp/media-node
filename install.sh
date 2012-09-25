#!/bin/bash

# Check The Linux Distribution

uname -a | grep Ubuntu
if [ $? -eq 0 ]
then
	echo -e "\033[34m Ubuntu Detected... \e[0m"
	echo -e "\033[34m Transfer Control To Ubuntu Installer Script... \e[0m"
	sudo setup/ubuntu.sh
fi
