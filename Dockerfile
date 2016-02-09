FROM ubuntu:14.04

MAINTAINER Harshad Yeola harshadyeola92@gmail.com

EXPOSE 1203

# Keep upstart from complaining
RUN dpkg-divert --local --rename --add /sbin/initctl
RUN ln -sf /bin/true /sbin/initctl

# Let the conatiner know that there is no tty
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update

RUN apt-get install -y wget curl

ADD ./ubuntu.sh /ubuntu.sh
RUN /bin/bash /ubuntu.sh

VOLUME /root/media-node/queued /root/media-node/temp /root/media-node/completed /root/media-node/log

WORKDIR /root/media-node

RUN npm install -g

RUN npm install formidable connect sqlite3

RUN touch /root/media-node/log/ffmpeg_server.log

ENTRYPOINT ["/usr/local/bin/node", "ffmpeg_server.js"]
