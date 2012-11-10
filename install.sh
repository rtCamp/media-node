#!/bin/bash


# Checking Permissions
Permission=$(id -u)
#echo $Permission
if [ $Permission -ne 0 ] 
then
        echo -e "\033[31m Super User Privilege Required... \e[0m"
        echo -e "\033[31m Uses:  sudo $0 \e[0m"
        exit 100 
fi


# Check The Linux Distribution
#uname -a | grep Ubuntu
#if [ $? -eq 0 ]
#then
#	echo -e "\033[34m Ubuntu Detected... \e[0m"
#	echo -e "\033[34m Transfer Control To Ubuntu Installer Script... \e[0m"
#	sudo setup/ubuntu.sh
#fi

KERNEL=`uname -s`

if [ "$KERNEL" = "Linux" ]
then
	if [ -f /etc/redhat-release ] || [ -f /etc/centos-release ]
	then
		sudo bash setup/redhat.sh

	elif [ -f /etc/lsb-release ]
	then
		sudo bash setup/ubuntu.sh

	elif [ -f  /etc/debian_version ]
	then
		sudo bash setup/debian.sh
	fi

else
	echo "echo -e "\033[31m Currently We Support Only Redhat, CentOS, Debian And Ubuntu Linux Distro...\e[0m""
	
fi
