#!/bin/bash



#Remove any existing packages
sudo apt-get remove ffmpeg x264 libav-tools libvpx-dev libx264-dev

#Update the dependencies
sudo apt-get update

#Check if target system is desktop or server
OSDETECT=$(dpkg --list | grep ubuntu-desktop)

if [ $OSDETECT -eq 0 ]
then

	#Ubuntu Desktop
	sudo apt-get -y install autoconf build-essential checkinstall git libfaac-dev libgpac-dev \
	libjack-jackd2-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev \
	librtmp-dev libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev \
	libx11-dev libxfixes-dev pkg-config texi2html yasm zlib1g-dev
else

	#Ubuntu Servers
	sudo apt-get -y install autoconf build-essential checkinstall git libfaac-dev libgpac-dev \
	libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev librtmp-dev libtheora-dev \
	libtool libvorbis-dev pkg-config texi2html yasm zlib1g-dev
fi

#Making directory for cloning encoders
MNDIR=$HOME/media-node
mkdir $MNDIR


#Install H.264 (x286) video encoder.
cd $MNDIR
git clone --depth 1 git://git.videolan.org/x264
cd x286
./configure --enable-static
make
sudo checkinstall --pkgname=x264 --pkgversion="3:$(./version.sh | awk -F'[" ]' '/POINT/{print $4"+git"$5}')" --backup=no --deldoc=yes --fstrans=no --default


#Install AAC (fdk-aac) audio encoder.
cd $MNDIR
git clone --depth 1 git://github.com/mstorsjo/fdk-aac.git
cd fdk-aac
autoreconf -fiv
./configure --disable-shared
make
sudo checkinstall --pkgname=fdk-aac --pkgversion="$(date +%Y%m%d%H%M)-git" --backup=no --deldoc=yes --fstrans=no --default


#Install VP8 (libvpx) video encoder and decoder.
cd $MNDIR
git clone --depth 1 http://git.chromium.org/webm/libvpx.git
cd libvpx
./configure
make
sudo checkinstall --pkgname=libvpx --pkgversion="1:$(date +%Y%m%d%H%M)-git" --backup=no --deldoc=yes --fstrans=no --default


#Install FFmpeg
cd $MNDIR
git clone --depth 1 git://source.ffmpeg.org/ffmpeg
cd ffmpeg
if [ $OSDETECT -eq 0 ]
then
	#Ubuntu Desktop
	./configure --enable-gpl --enable-libfaac --enable-libfdk-aac --enable-libmp3lame \
	--enable-libopencore-amrnb --enable-libopencore-amrwb --enable-librtmp --enable-libtheora \
	--enable-libvorbis --enable-libvpx --enable-x11grab --enable-libx264 --enable-nonfree \
	--enable-version3
else
	#Ubuntu Server
	./configure --enable-gpl --enable-libfaac --enable-libfdk-aac --enable-libmp3lame \
	--enable-libopencore-amrnb --enable-libopencore-amrwb --enable-librtmp --enable-libtheora \
	--enable-libvorbis --enable-libvpx --enable-libx264 --enable-nonfree \
	--enable-version3
fi
make
sudo checkinstall --pkgname=ffmpeg --pkgversion="5:$(date +%Y%m%d%H%M)-git" --backup=no --deldoc=yes --fstrans=no --default


hash x264 ffmpeg ffplay ffprobe
