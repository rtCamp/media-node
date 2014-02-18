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
echo -e "\033[34m Removing Unwanted Softwares... \e[0m"
yum -y erase ffmpeg x264 x264-devel yasm


# Create A Repository For Libfaac
echo "[linuxtech]" >> /etc/yum.repos.d/linuxtech.repo
echo "name=LinuxTECH" >> /etc/yum.repos.d/linuxtech.repo
echo "baseurl=http://pkgrepo.linuxtech.net/el6/release/" >> /etc/yum.repos.d/linuxtech.repo
echo "enabled=1" >> /etc/yum.repos.d/linuxtech.repo
echo "gpgcheck=1" >> /etc/yum.repos.d/linuxtech.repo
echo "gpgkey=http://pkgrepo.linuxtech.net/el6/release/RPM-GPG-KEY-LinuxTECH.NET" >> /etc/yum.repos.d/linuxtech.repo

#Install The Packages
clear
echo -e "\033[34m  Installing Packages... \e[0m"
yum -y install git --disablerepo=updates
yum -y install gcc gcc-c++ git make nasm pkgconfig wget libfaac-devel \
|| OwnError "Installation Failed"


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
# Yasm Is Recommended For x264 & FFmpeg
clear
cd $MNDIR
echo -e "\033[34m Downloading YASM... \e[0m"
wget -c http://www.tortall.net/projects/yasm/releases/yasm-1.2.0.tar.gz \
|| OwnError "Unable To Download YASM"
tar xzvf yasm-1.2.0.tar.gz
cd yasm-1.2.0
./configure --prefix=/usr || OwnError "Unable To Configure YASM"
make
echo -e "\033[34m Installing YASM \e[0m"
make install || OwnError "Unable To Install YASM"





# Install LAME 
clear
cd $MNDIR
echo -e "\033[34m Downloading LAME... \e[0m"
wget -c http://downloads.sourceforge.net/project/lame/lame/3.99/lame-3.99.5.tar.gz \
|| OwnError "Unable To Downlaod LAME"
tar xzvf lame-3.99.5.tar.gz
cd lame-3.99.5
./configure --disable-shared --enable-nasm || OwnError "Unable To Configure LAME"
make
echo -e "\033[34m Installing LAME \e[0m"
make install || OwnError "Unable To Install LAME"


# Install Libogg 
clear
cd $MNDIR
echo -e "\033[34m Downloading Libogg... \e[0m"
wget -c http://downloads.xiph.org/releases/ogg/libogg-1.3.0.tar.gz \
|| OwnError "Unable To Downlaod Libogg"
tar xzvf libogg-1.3.0.tar.gz
cd libogg-1.3.0
./configure --disable-shared || OwnError "Unable To Configure Libogg"
make
echo -e "\033[34m Installing Libogg \e[0m"
make install || OwnError "Unable To Install Libogg"


# Install Libvorbis
clear
cd $MNDIR
echo -e "\033[34m Downloading Libvorbis... \e[0m"
wget -c http://downloads.xiph.org/releases/vorbis/libvorbis-1.3.3.tar.gz \
|| OwnError "Unable To Downlaod Libvorbis"
tar xzvf libvorbis-1.3.3.tar.gz
cd libvorbis-1.3.3
./configure --disable-shared || OwnError "Unable To Configure Libvorbis"
make
echo -e "\033[34m Installing Libvorbis \e[0m"
make install || OwnError "Unable To Install Libvorbis"


# Install VP8 (libvpx) Video Encoder/Decoder
clear
cd $MNDIR
echo -e "\033[34m  Cloning VP8 Repo... \e[0m"
git clone http://git.chromium.org/webm/libvpx.git \
|| OwnError "Unable To Clonning VP8 Repository"
cd libvpx
git checkout v1.3.0 || OwnError "Unable To checkout VP8 v1.3.0"
./configure || OwnError "Unable To Configure VP8"
make
make install || OwnError "Unable To Install VP8"


# Install Zlib
clear
cd $MNDIR
echo -e "\033[34m Downloading Zlib... \e[0m"
wget -c http://zlib.net/zlib-1.2.8.tar.gz \
|| OwnError "Unable To Downlaod Zlib"
tar xzvf zlib-1.2.8.tar.gz
cd zlib-1.2.8
./configure || OwnError "Unable To Configure Zlib"
make
echo -e "\033[34m Installing Zlib \e[0m"
make install || OwnError "Unable To Install Zlib"


# Install FFmpeg
clear
cd $MNDIR
echo -e "\033[34m  Cloning FFmpeg Repo... \e[0m"
git clone git://source.ffmpeg.org/ffmpeg || OwnError "Unable To Clonning FFmpeg Repository"
cd ffmpeg
./configure --enable-gpl --enable-libmp3lame --enable-libvorbis --enable-libvpx --enable-libx264 --enable-libfaac --enable-nonfree \
|| OwnError "Unable To Configure FFmpeg"
make
make install || OwnError "Unable To Install FFmpeg"


# Adding Entry In Hash Table
#clear
#echo -e "\033[34m Updating Hash Table... \e[0m"
#hash x264 ffmpeg ffplay ffprobe || OwnError "Unable To Update Hash Table"



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
# Sudo Don't Insclude /usr/local/bin and /usr/local/sbin Path in $PATH Variable
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
echo -e "\033[34m Node Version... \e[0m"
node --version || OwnError "Node Is Not Properly Installed"


# Install NPM (Node Package Manager)
clear
cd $MNDIR
echo -e "\033[34m Installing NPM Node Package Manager... \e[0m"
curl https://npmjs.org/install.sh | bash || OwnError "Unable To Fetch & Install NPM"

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

# Fix libx264.so.x
echo "/usr/local/lib" >> /etc/ld.so.conf.d/media-node.conf || OwnError "Unable To Set Library For Media-Node"
ldconfig || OwnError "Unable To Execute ldconfig"

# Adding Crontab Entry
echo "PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin" >> /var/spool/cron/root || OwnError "Unable To Install Crontabs"
echo "@reboot cd $MNDIR && node ffmpeg_server.js >> /var/log/ffmpeg_server.log &" >> /var/spool/cron/root || OwnError "Unable To Install Crontabs"

# Start Node
# Sudo Don't Insclude /usr/local/bin and /usr/local/sbin Path in $PATH Variable
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
cd $MNDIR && node ffmpeg_server.js >> /var/log/ffmpeg_server.log & #|| OwnError "Unable To Start Node Server"
