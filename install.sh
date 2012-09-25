#!/bin/bash


# Checking Permissions
Permission=$(id -u)
#echo $Permission
if [ $Permission -ne 0 ] 
then
        echo -e "\033[34m Super User Privilege Required... \e[0m"
        echo -e "\033[34m Uses:  sudo $0 \e[0m"
        exit 100 
fi


# Check The Linux Distribution
uname -a | grep Ubuntu
if [ $? -eq 0 ]
then
	echo -e "\033[34m Ubuntu Detected... \e[0m"
	echo -e "\033[34m Transfer Control To Ubuntu Installer Script... \e[0m"
	sudo setup/ubuntu.sh
fi
