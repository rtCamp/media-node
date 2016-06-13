#!/bin/bash

# Supported Ubuntu Distro:
#	1. Ubuntu 8.04  Desktop/Server
#	2. Ubuntu 10.04 Desktop/Server
#	3. Ubuntu 10.10 Desktop/Server
#	4. Ubuntu 11.04 Desktop/Server
#	5. Ubuntu 11.10 Desktop/Server
#	6. Ubuntu 12.04 Desktop/Server
#	7. Ubuntu 14.04 Desktop/Server


#pwd | grep setup &> /dev/null
#if [ $? -eq 0 ]
#then
#	BASEDIR=$(cd ..; pwd)
#else
#	BASEDIR=$(pwd)
#fi
#echo $BASEDIR
#exit 0;
#mkdir $MNDIR || OwnError "Unable To Create $MNDIR :("
#echo -e "\033[34m Directory: $MNDIR Created \e[0m"



# Checking Permissions
Permission=$(id -u)
#echo $Permission
if [ $Permission -ne 0 ] 
then
        echo -e "\033[31m Super User Privilege Required... \e[0m"
        echo -e "\033[31m Uses:  sudo $0 \e[0m"
        exit 100 
fi


# Capture Errors
OwnError()
{
	#echo $@ >&2
	clear
	echo -e "\033[31m$@ \e[0m"
	exit 100
}


# Check The Target System Is Desktop/Server
dpkg --list | grep ubuntu-desktop &> /dev/null
DesktopDetect=$(echo $?)

# Check The Target System Version
cat /etc/lsb-release | grep 8.04  &> /dev/null
Ubuntu804=$(echo $?)
cat /etc/lsb-release | grep 10.04 &> /dev/null
Ubuntu1004=$(echo $?)
cat /etc/lsb-release | grep 10.10 &> /dev/null
Ubuntu1010=$(echo $?)
cat /etc/lsb-release | grep 11.04 &> /dev/null
Ubuntu1104=$(echo $?)
cat /etc/lsb-release | grep 11.10 &> /dev/null
Ubuntu1110=$(echo $?)
cat /etc/lsb-release | grep 12.04 &> /dev/null
Ubuntu1204=$(echo $?)
cat /etc/lsb-release | grep 14.04 &> /dev/null
Ubuntu1404=$(echo $?)

if [ $Ubuntu804 -eq 0 ]
then
	Version=Ubuntu804
elif [ $Ubuntu1004 -eq 0 ]
then
	Version=Ubuntu1004
elif [ $Ubuntu1010 -eq 0 ]
then
	Version=Ubuntu1010
elif [ $Ubuntu1104 -eq 0 ]
then
	Version=Ubuntu1104
elif [ $Ubuntu1110 -eq 0 ]
then
	Version=Ubuntu1110
elif [ $Ubuntu1204 -eq 0 ]
then
	Version=Ubuntu1204
elif [ $Ubuntu1404 -eq 0 ]
then
	Version=Ubuntu1404
else
	Version=Ubuntu1204
fi

# Tell Users About Detetcted Desktop & Version
clear
if [ $DesktopDetect -eq 0 ]
then
	echo -e "\033[34m $Version Desktop Detected... \e[0m"
else
	echo -e "\033[34m $Version Server Detected... \e[0m"
fi


# Remove Any Existing Packages
clear
if [ $Version = Ubuntu804 ]
then
	echo -e "\033[34m Removing Unwanted Softwares From $Version... \e[0m"
	sudo apt-get -y remove ffmpeg x264 libx264-dev yasm liblame-dev
elif [ $Version = Ubuntu1004 ]
then
	echo -e "\033[34m Removing Unwanted Softwares From $Version... \e[0m"
	sudo apt-get -y remove ffmpeg x264 libx264-dev yasm libmp3lame-dev
elif [ $Version = Ubuntu1010 ] || [ $Version = Ubuntu1104 ] || [ $Version = Ubuntu1110 ] || [ $Version = Ubuntu1204 ] || [ $Version = Ubuntu1404 ]
then
	echo -e "\033[34m Removing Unwanted Softwares From $Version... \e[0m"
	sudo apt-get -y remove ffmpeg x264 libav-tools libvpx-dev libx264-dev
fi

if [ $Version = Ubuntu1010 ] || [ $Version = Ubuntu1104 ] || [ $Version = Ubuntu1110 ] || [ $Version = Ubuntu1204 ] || [ $Version = Ubuntu1404 ]
then
	cat /etc/apt/sources.list | grep "^[^#]*multiverse$" &> /dev/null
	if [ $? -eq 0 ]
	then
		echo -e "\033[34m Already Multiverse Reporitory Enabled... \e[0m"
	else
		echo "deb http://archive.ubuntu.com/ubuntu/ precise multiverse" >> /etc/apt/sources.list \
		|| OwnError "Ubable To Add Multiverse Repository :("
		echo "deb http://archive.ubuntu.com/ubuntu/ precise-updates multiverse" >> /etc/apt/sources.list \
		|| OwnError "Ubable To Add Multiverse Repository :("
	fi
fi

# Update The Dependencies
clear
echo -e "\033[34m Updating Dependencies... \e[0m"
sudo apt-get update || OwnError "Dependencies Update Failed :("


#Install The Packages
clear
if [ $Version = Ubuntu804 ]
then
	if [ $DesktopDetect -eq 0 ]
	then
		# Ubuntu8.04 Desktop
		echo -e "\033[34m  Installing Packages For $Version Desktop \e[0m"
		sudo apt-get -y install build-essential git-core checkinstall texi2html libfaac-dev \
		libsdl1.2-dev libvorbis-dev libx11-dev libxext-dev libxfixes-dev pkg-config zlib1g-dev \
		nasm libogg-dev curl \
		|| OwnError "$Version Desktop Installation Failed :("
	else
		# Ubuntu8.04 Server
		echo -e "\033[34m  Installing Packages For $Version Server \e[0m"
		sudo apt-get -y install build-essential git-core checkinstall texi2html libfaac-dev \
		libvorbis-dev pkg-config zlib1g-dev nasm libogg-dev curl libsdl1.2-dev \
		|| OwnError "$Version Server Installation Failed :("
	fi
elif [ $Version = Ubuntu1004 ]
then
	if [ $DesktopDetect -eq 0 ]
	then
		# Ubuntu10.04 Desktop
		echo -e "\033[34m  Installing Packages For $Version Desktop \e[0m"
		sudo apt-get install -y build-essential git-core checkinstall texi2html libfaac-dev \
		libopencore-amrnb-dev libopencore-amrwb-dev libsdl1.2-dev libtheora-dev \
		libvorbis-dev libx11-dev libxfixes-dev pkg-config zlib1g-dev nasm \
		|| OwnError "$Version Desktop Installation Failed :("
	else
		# Ubuntu10.04  Server
		echo -e "\033[34m  Installing Packages For $Version Server \e[0m"
		sudo apt-get install -y build-essential git-core checkinstall texi2html libfaac-dev \
		libopencore-amrnb-dev libopencore-amrwb-dev libtheora-dev libvorbis-dev pkg-config zlib1g-dev \
		nasm libsdl1.2-dev \
		|| OwnError "$Version Server Installation Failed :("
	fi
elif [ $Version = Ubuntu1010 ] || [ $Version = Ubuntu1104 ] || [ $Version = Ubuntu1110 ] || [ $Version = Ubuntu1204 ] || [ $Version = Ubuntu1404 ]
then
	if [ $DesktopDetect -eq 0 ]
	then

		# Ubuntu10.10 11.04 11.10 12.04 14.04 Desktop
		echo -e "\033[34m  Installing Packages For $Version Desktop \e[0m"
		sudo apt-get -y install autoconf build-essential checkinstall git libfaac-dev libgpac-dev \
		libjack-jackd2-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev \
		librtmp-dev libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev \
		libx11-dev libxfixes-dev pkg-config texi2html zlib1g-dev \
		|| OwnError "$Version Desktop Installation Failed :("
	else

		# Ubuntu10.10 11.04 11.10 12.04 14.04 Servers
		echo -e "\033[34m  Installing Packages For $Version Desktop \e[0m"
		sudo apt-get -y install autoconf build-essential checkinstall git libfaac-dev libgpac-dev \
		libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev librtmp-dev libtheora-dev \
		libtool libvorbis-dev pkg-config texi2html yasm zlib1g-dev libsdl1.2-dev \
		|| OwnError "$Version Server Installation Failed :("
	fi
fi


# Making Directory For Cloning Encoders
clear
if [ -d ~root/media-node ]
then
	MNDIR=~root/media-node/
else
	mkdir ~root/media-node/ || OwnError "Unable To Create ~root/media-node :("
	MNDIR=~root/media-node/
fi



# Install Yasm Assembler
# Yasm Is Recommended For x264 & FFmpeg In Ubuntu8.04/ 10.04
if [ $Version = Ubuntu804 ] || [ $Version = Ubuntu1004 ] || [ $Version = Ubuntu1204 ]
then
	clear
	cd $MNDIR
	echo -e "\033[34m Downloading/Installing Yasm... \e[0m"
	wget -c http://www.tortall.net/projects/yasm/releases/yasm-1.2.0.tar.gz || OwnError "Unable To Fetch YASM :("
	tar zxvf yasm-1.2.0.tar.gz
	cd yasm-1.2.0
	./configure || OwnError "Unable To Configure YASM :("
	make
	sudo checkinstall --pkgname=yasm --pkgversion="1.2.0" --backup=no --deldoc=yes --default \
	|| OwnError "Unable To Install YASM For $Version :("
fi


# Install H.264 (x264) Video Encoder
clear
cd $MNDIR
echo -e "\033[34m Cloning x264 Repo... \e[0m"
git clone --depth 1 git://git.videolan.org/x264 || OwnError "Unable To Clonning x264 Repository:("
cd x264
./configure --enable-shared --enable-static || OwnError "Unable To Configure x264 :("
make
if [ $Version = Ubuntu804 ]
then
	# Ubuntu 8.04
	echo -e "\033[34m Installing x264 For $Version \e[0m"
	sudo checkinstall --pkgname=x264 --pkgversion="2:0.svn$(date +%Y%m%d)-0.0ubuntu1" \
	--backup=no --deldoc=yes --default \
	|| OwnError "Unable To Install x264 For $Version :("
elif [ $Version = Ubuntu1004 ]
then
	#Ubuntu 10.04
	echo -e "\033[34m Installing x264 For $Version \e[0m"
	sudo checkinstall --pkgname=x264 --default --pkgversion="3:$(./version.sh | \
	awk -F'[" ]' '/POINT/{print $4"+git"$5}')" --backup=no --deldoc=yes \
	|| OwnError "Unable To Install x264 For $Version :("
elif [ $Version = Ubuntu1010 ] || [ $Version = Ubuntu1104 ] || [ $Version = Ubuntu1110 ] || [ $Version = Ubuntu1204 ] || [ $Version = Ubuntu1404 ]
then
	# Ubuntu 10.10 11.04 11.10 12.04 14.04
	echo -e "\033[34m Installing x264 For $Version \e[0m"
	sudo checkinstall --pkgname=x264 --pkgversion="3:$(./version.sh | \
	awk -F'[" ]' '/POINT/{print $4"+git"$5}')" --backup=no --deldoc=yes \
	--fstrans=no --default \
	|| OwnError "Unable To Install x264 For $Version :("
fi


# Install LAME MP3 Audio Encoder
# LAME Is Recommended For Ubuntu8.04/ 10.04
if [ $Version = Ubuntu804 ] || [ $Version = Ubuntu1004 ]
then
	clear
	cd $MNDIR
	echo -e "\033[34m  Downloading LAME... \e[0m"
	# Added liblame-dev & nasm To Above Common Remove/Install Block
	# sudo apt-get -y remove liblame-dev
	# sudo apt-get -y install nasm
	wget -c http://downloads.sourceforge.net/project/lame/lame/3.99/lame-3.99.5.tar.gz || OwnError "Unable To Fetch LAME :("
	tar zxvf lame-3.99.5.tar.gz
	cd lame-3.99.5
	./configure --enable-nasm --disable-shared || OwnError "Unable To Configure LAME :("
	make
	sudo checkinstall --pkgname=lame-ffmpeg --pkgversion="3.99.5" --backup=no \
	--deldoc=yes --fstrans=no --default \
	|| OwnError "Unable To Install LAME For $Version :("
fi


# Install libtheora Video Encoder
# Libtheora Is Recommended For Ubuntu8.04
if [ $Version = Ubuntu804 ]
then
	clear
	cd $MNDIR
	echo -e "\033[34m  Downloading Libtheora... \e[0m"
	# Added libogg-dev To Above Common Install Block
	# sudo apt-get -y install libogg-dev
	wget -c http://downloads.xiph.org/releases/theora/libtheora-1.1.1.tar.gz || OwnError "Unable To Fetch Libtheora :("
	tar zxvf libtheora-1.1.1.tar.gz
	cd libtheora-1.1.1
	./configure --disable-shared || OwnError "Unable To Configure Libtheora :("
	make
	sudo checkinstall --pkgname=libtheora --pkgversion="1.1.1" --backup=no \
	--deldoc=yes --fstrans=no --default \
	|| OwnError "Unable To Install Lintheora For $Version :("
fi


# Install AAC (fdk-aac) Audio Encoder
# AAC Is Recommended For Ubuntu 10.10/11.04/11.10/12.04/14.04
if [ $Version = Ubuntu1010 ] || [ $Version = Ubuntu1104 ] || [ $Version = Ubuntu1110 ] || [ $Version = Ubuntu1204 ] || [ $Version = Ubuntu1404 ]
then
	clear
	cd $MNDIR
	echo -e "\033[34m  Cloning FDK-AAC Repo... \e[0m"
	git clone --depth 1 git://github.com/mstorsjo/fdk-aac.git || OwnError "Unable To Clonning AAC Repository:("
	cd fdk-aac
	autoreconf -fiv
	./configure --disable-shared || OwnError "Unable To Configure AAC :("
	make
	sudo checkinstall --pkgname=fdk-aac --pkgversion="$(date +%Y%m%d%H%M)-git" --backup=no \
	--deldoc=yes --fstrans=no --default \
	|| OwnError "Unable To Install AAC For $Version :("
fi


# Install VP8 (libvpx) Video Encoder/Decoder
clear
cd $MNDIR
echo -e "\033[34m  Cloning VP8 Repo... \e[0m"
if [ $Version = Ubuntu804 ]
then
	git clone https://git.chromium.org/webm/libvpx.git || OwnError "Unable To Clonning VP8 Repository For $Version :("
elif [ $Version = Ubuntu 1004 ] || [ $Version = Ubuntu1010 ] || [ $Version = Ubuntu1104 ] || [ $Version = Ubuntu1110 ] || [ $Version = Ubuntu1204 ] || [ $Version = Ubuntu1404 ]
then
	git clone --depth 1 https://chromium.googlesource.com/webm/libvpx/ || OwnError "Unable To Clonning VP8 Repository For $Version :("
fi
cd libvpx
./configure || OwnError "Unable To Configure VP8 :("
make
sudo checkinstall --pkgname=libvpx --pkgversion="1:$(date +%Y%m%d%H%M)-git" --backup=no \
	--deldoc=yes --fstrans=no --default \
	|| OwnError "Unable To Install VP8 For $Version :("


# Install FFmpeg
clear
cd $MNDIR
echo -e "\033[34m  Cloning FFmpeg Repo... \e[0m"
git clone --depth 1 git://source.ffmpeg.org/ffmpeg || OwnError "Unable To Clonning FFmpeg Repository:("
cd ffmpeg

if [ $Version = Ubuntu804 ]
then
	if [ $DesktopDetect -eq 0 ]
	then
		#Ubuntu8.04 Desktop
		./configure --enable-gpl --enable-version3 --enable-nonfree --enable-libfaac \
		--enable-libmp3lame --enable-libtheora --enable-libvorbis --enable-libvpx \
		--enable-libx264 --enable-x11grab \
		|| OwnError "Unable To Configure FFmpeg For $Version Desktop :("
	else
		#Ubuntu8.04 Server
		./configure --enable-gpl --enable-version3 --enable-nonfree --enable-libfaac \
		--enable-libmp3lame --enable-libtheora --enable-libvorbis --enable-libvpx \
		--enable-libx264 \
		|| OwnError "Unable To Configure FFmpeg For $Version Server :("
	fi

	make
	sudo checkinstall --pkgname=ffmpeg --pkgversion="4:git-$(date +%Y%m%d)" --backup=no \
	--deldoc=yes --default \
	|| OwnError "Unable To Install FFmpeg For $Version :("

elif [ $Version = Ubuntu1004 ]
then
	if [ $DesktopDetect -eq 0 ]
	then
		#Ubuntu 10.04 Desktop
		./configure --enable-gpl --enable-libfaac --enable-libmp3lame --enable-libopencore-amrnb \
		--enable-libopencore-amrwb --enable-libtheora --enable-libvorbis --enable-libvpx \
		--enable-libx264 --enable-nonfree --enable-version3 --enable-x11grab \
		|| OwnError "Unable To Configure FFmpeg For $Version Desktop :("
	else
		#Ubuntu10.04 Server
		./configure --enable-gpl --enable-libfaac --enable-libmp3lame --enable-libopencore-amrnb \
		--enable-libopencore-amrwb --enable-libtheora --enable-libvorbis --enable-libvpx \
		--enable-libx264 --enable-nonfree --enable-version3 \
		|| OwnError "Unable To Configure FFmpeg For $Version Server :("
	fi

	make
	sudo checkinstall --pkgname=ffmpeg --pkgversion="5:$(./version.sh)" --backup=no \
	--deldoc=yes --default \
	|| OwnError "Unable To Install FFmpeg For $Version :("

elif [ $Version = Ubuntu1010 ] || [ $Version = Ubuntu1104 ] || [ $Version = Ubuntu1110 ] || [ $Version = Ubuntu1204 ] || [ $Version = Ubuntu1404 ]
then
	if [ $DesktopDetect -eq 0 ]
	then
		# Ubuntu Desktop
		./configure --enable-gpl --enable-libfaac --enable-libfdk-aac --enable-libmp3lame \
		--enable-libopencore-amrnb --enable-libopencore-amrwb --enable-librtmp --enable-libtheora \
		--enable-libvorbis --enable-libvpx --enable-x11grab --enable-libx264 --enable-nonfree \
		--enable-version3 \
		|| OwnError "Unable To Configure FFmpeg For $Version Desktop :("
	else
		# Ubuntu Server
		./configure --enable-gpl --enable-libfaac --enable-libfdk-aac --enable-libmp3lame \
		--enable-libopencore-amrnb --enable-libopencore-amrwb --enable-librtmp --enable-libtheora \
		--enable-libvorbis --enable-libvpx --enable-libx264 --enable-nonfree \
		--enable-version3 \
		|| OwnError "Unable To Configure FFmpeg For $Version Server :("
	fi

	make
	sudo checkinstall --pkgname=ffmpeg --pkgversion="5:$(date +%Y%m%d%H%M)-git" --backup=no \
	--deldoc=yes --fstrans=no --default \
	|| OwnError "Unable To Install FFmpeg For $Version :("
fi

# Adding Entry In Hash Table
clear
echo -e "\033[34m Updating Hash Table... \e[0m"
hash x264 ffmpeg ffplay ffprobe || OwnError "Unable To Update Hash Table :("



# Install Node
clear
cd $MNDIR
echo -e "\033[34m Downloading Node... \e[0m"
wget -c http://nodejs.org/dist/v0.10.13/node-v0.10.13.tar.gz || OwnError "Unable To Fetch Node"
tar -zxvf node-v0.10.13.tar.gz
cd node-v0.10.13
./configure || OwnError "Unable To Configure Node"
make
make install || OwnError "Unable To Install Node"

# Check Node Is Installed
echo -e "\033[34m Node Version... \e[0m"
node --version || OwnError "Node Is Not Properly Installed :("


# Install NPM (Node Package Manager)
clear
cd $MNDIR
echo -e "\033[34m Installing NPM (Node Package Manager)... \e[0m"
curl -sL https://npmjs.org/install.sh | sudo sh || OwnError "Unable To Fetch & Install NPM :("

# Check NPM IS Installed
echo -e "\033[34m NPM Version... \e[0m"
npm -v || OwnError "NPM Is Not Properly Installed :("


# Clonning The Media-Node Repository
clear
cd $MNDIR
echo -e "\033[34m Installing Node Module... \e[0m"
sudo npm install || OwnError "Unable To Install Node Module :("
#echo -e "\033[34m Clonning Media Node Repository... \e[0m"
#git clone git://github.com/rtCamp/media-node.git
#cd media-node
#echo -e "\033[34m Installing Formidable Node Module... \e[0m"
#sudo npm install formidable || OwnError "Unable To Install Formidable Node Module :("
#echo -e "\033[34m Installing Connect Node Module... \e[0m"
#sudo npm install connect || OwnError "Unable To Install Connect Node Module :("
#echo -e "\033[34m Installing Sqlite3 Node Module... \e[0m"
#sudo npm install sqlite3 || OwnError "Unable To Install Sqlite3 Node Module :("

# Copy Media Node Files
#clear
#cd $MNDIR
#cp -rv $BASEDIR/* . || OwnError "Unable To Copy Media Node Files :("
#cp -rv $BASEDIR/.* . || OwnError "Unable To Copy Media Node Files :("
clear
cd /tmp
git clone git://github.com/rtCamp/media-node.git
cp -rv  media-node/* $MNDIR/ || OwnError "Unable To Copy Media Node Files :("
cp -rv  media-node/.git $MNDIR/ || OwnError "Unable To Copy Media Node Files :("

# Fix libx264.so.x
echo "/usr/local/lib" >> /etc/ld.so.conf.d/media-node.conf || OwnError "Unable To Set Library For Media-Node"
ldconfig || OwnError "Unable To Execute ldconfig"

# Adding Crontab Entry
echo "PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin" >> /var/spool/cron/crontabs/root || OwnError "Unable To Install Crontabs :("
echo "@reboot cd $MNDIR && node ffmpeg_server.js >> /var/log/ffmpeg_server.log &" >> /var/spool/cron/crontabs/root || OwnError "Unable To Install Crontabs :("

# Start Node
cd $MNDIR && node ffmpeg_server.js >> /var/log/ffmpeg_server.log & #|| OwnError "Unable To Start Node Server :("
