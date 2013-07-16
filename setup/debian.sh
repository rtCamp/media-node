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


# Capture Errors
OwnError()
{
	clear
	echo -e "\033[31m$@ \e[0m"
	exit 101
}


# Save The Base Directory Path
#pwd | grep setup &> /dev/null
#if [ $? -eq 0 ]
#then
#	BASEDIR=$(cd ..; pwd)
#else
#	BASEDIR=$(pwd)
#fi


# Remove Any Existing Packages
clear
echo -e "\033[34m Removing Unwanted Softwares From Debian... \e[0m"
sudo apt-get -y remove ffmpeg x264 libav-tools libvpx-dev libx264-dev

# Add Multimedia Repository
cat /etc/apt/sources.list | grep multimedia &> /dev/null
if [ $? -eq 0 ]
then
	echo -e "\033[34m Multimedia Repository Already Enabled... \e[0m"
else
	echo "deb http://www.deb-multimedia.org squeeze main non-free" >> /etc/apt/sources.list \
	|| OwnError "Ubable To Add Multimedia Repository"
	echo "deb http://www.deb-multimedia.org squeeze-backports main" >> /etc/apt/sources.list \
	|| OwnError "Ubable To Add Multimedia Repository"
fi


# Install Deb Multimedia Keys
sudo apt-get install -y deb-multimedia-keyring

# Update The Dependencies
clear
echo -e "\033[34m Updating Dependencies... \e[0m"
sudo apt-get update || OwnError "Dependencies Update Failed"


#Install The Packages
clear
echo -e "\033[34m  Installing Packages For Debian \e[0m"
sudo apt-get -y install autoconf build-essential checkinstall git libfaac-dev \
libgpac-dev libjack-jackd2-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev \
librtmp-dev libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev \
libx11-dev libxfixes-dev pkg-config texi2html zlib1g-dev texi2html \
|| OwnError "Debian Installation Failed"


# Making Directory For Cloning Encoders
clear
if [ -d ~root/media-node ]
then
	MNDIR=~root/media-node/
else
	mkdir ~root/media-node/ || OwnError "Unable To Create ~root/media-node"
	MNDIR=~root/media-node/
fi


# Install Yasm Assembler
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


# Install H.264 (x264) Video Encoder
clear
cd $MNDIR
echo -e "\033[34m Cloning x264 Repo... \e[0m"
git clone --depth 1 git://git.videolan.org/x264 || OwnError "Unable To Clonning x264 Repository"
cd x264
./configure --enable-shared --enable-static || OwnError "Unable To Configure x264"
make
echo -e "\033[34m Installing x264 For Debian \e[0m"
sudo checkinstall --pkgname=x264 --pkgversion="3:$(./version.sh | \
awk -F'[" ]' '/POINT/{print $4"+git"$5}')" --backup=no --deldoc=yes \
--fstrans=no --default \
|| OwnError "Unable To Install x264 For Debian"




# Install AAC (fdk-aac) Audio Encoder
# AAC Is Recommended For Ubuntu 10.10/11.04/11.10/12.04
clear
cd $MNDIR
echo -e "\033[34m  Cloning FDK-AAC Repo... \e[0m"
git clone --depth 1 git://github.com/mstorsjo/fdk-aac.git \
|| OwnError "Unable To Clonning AAC Repository"
cd fdk-aac
autoreconf -fiv
./configure --disable-shared || OwnError "Unable To Configure AAC"
make
sudo checkinstall --pkgname=fdk-aac --pkgversion="$(date +%Y%m%d%H%M)-git" --backup=no \
--deldoc=yes --fstrans=no --default \
|| OwnError "Unable To Install AAC For Debian"


# Install VP8 (libvpx) Video Encoder/Decoder
clear
cd $MNDIR
echo -e "\033[34m  Cloning VP8 Repo... \e[0m"
git clone --depth 1 http://git.chromium.org/webm/libvpx.git \
|| OwnError "Unable To Clonning VP8 Repository For Debian"
cd libvpx
./configure || OwnError "Unable To Configure VP8"
make
sudo checkinstall --pkgname=libvpx --pkgversion="1:$(date +%Y%m%d%H%M)-git" --backup=no \
--deldoc=yes --fstrans=no --default \
|| OwnError "Unable To Install VP8 For Debian"


# Install FFmpeg
clear
cd $MNDIR
echo -e "\033[34m  Cloning FFmpeg Repo... \e[0m"
git clone --depth 1 git://source.ffmpeg.org/ffmpeg \
|| OwnError "Unable To Clonning FFmpeg Repository"
cd ffmpeg

./configure --enable-gpl --enable-libfaac --enable-libfdk-aac --enable-libmp3lame \
--enable-libopencore-amrnb --enable-libopencore-amrwb --enable-librtmp --enable-libtheora \
--enable-libvorbis --enable-libvpx --enable-x11grab --enable-libx264 --enable-nonfree \
--enable-version3 \
|| OwnError "Unable To Configure FFmpeg For Debian"

make
sudo checkinstall --pkgname=ffmpeg --pkgversion="5:$(date +%Y%m%d%H%M)-git" --backup=no \
--deldoc=yes --fstrans=no --default \
|| OwnError "Unable To Install FFmpeg For Debian"


# Adding Entry In Hash Table
clear
echo -e "\033[34m Updating Hash Table... \e[0m"
hash x264 ffmpeg ffplay ffprobe || OwnError "Unable To Update Hash Table"



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
node --version || OwnError "Node Is Not Properly Installed"


# Install NPM (Node Package Manager)
clear
cd $MNDIR
echo -e "\033[34m Installing NPM (Node Package Manager)... \e[0m"
curl https://npmjs.org/install.sh | sudo sh || OwnError "Unable To Fetch & Install NPM"

# Check NPM IS Installed
echo -e "\033[34m NPM Version... \e[0m"
npm -v || OwnError "NPM Is Not Properly Installed"


# Clonning The Media-Node Repository
clear
cd $MNDIR
#echo -e "\033[34m Clonning Media Node Repository... \e[0m"
#git clone git://github.com/rtCamp/media-node.git
#cd media-node
echo -e "\033[34m Installing Formidable Node Module... \e[0m"
npm install formidable || OwnError "Unable To Install Formidable Node Module"
echo -e "\033[34m Installing Connect Node Module... \e[0m"
npm install connect || OwnError "Unable To Install Connect Node Module"
echo -e "\033[34m Installing Sqlite3 Node Module... \e[0m"
npm install sqlite3 || OwnError "Unable To Install Sqlite3 Node Module"

# Copy Media Node Files
#clear
#cd $MNDIR
#cp -rv $BASEDIR/* . || OwnError "Unable To Copy Media Node Files"
#cp -rv $BASEDIR/.* . || OwnError "Unable To Copy Media Node Files"
clear
cd /tmp
git clone git://github.com/rtCamp/media-node.git
cp -rv  media-node/* $MNDIR/ || OwnError "Unable To Copy Media Node Files :("
cp -rv  media-node/.git $MNDIR/ || OwnError "Unable To Copy Media Node Files :("


# Adding Crontab Entry
echo "PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin" >> /var/spool/cron/crontabs/root || OwnError "Unable To Install Crontabs"
echo "@reboot cd $MNDIR && node ffmpeg_server.js >> /var/log/ffmpeg_server.log &" >> /var/spool/cron/crontabs/root || OwnError "Unable To Install Crontabs"

# Start Node
cd $MNDIR && node ffmpeg_server.js >> /var/log/ffmpeg_server.log & #|| OwnError "Unable To Start Node Server :("
