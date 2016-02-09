#!/bin/bash

command=$1

usage () {
  echo "Usage: launcher COMMAND CONFIG [--skip-prereqs]"
  echo "Commands:"
  echo "    start:      Start/initialize a container"
  echo "    stop:       Stop a running container"
  echo "    restart:    Restart a container"
  echo "    logs:       Docker logs for container"
  exit 1
}

set_existing_container(){
  existing=`docker ps -a | awk '{ print $1, $(NF) }' | grep " media-node" | awk '{ print $1 }'`
}

run_stop () {
    set_existing_container
    if [ ! -z $existing ]
    then
        (
            set -x
            docker stop -t 10 media-node
        )
    else
        echo "media-node was not started !"
        exit 1
    fi
}

run_start () {
    mkdir -p /root/media-node/{temp,completed,queued}
    existing=`docker ps | awk '{ print $1, $(NF) }' | grep " media-node" | awk '{ print $1 }'`
    echo $existing
    if [ ! -z $existing ]
    then
        echo "Nothing to do, your container has already started!"
        exit 1
    # else
    #     docker run -id --name media-node --restart=always -p 1203:1203 -v /root/media-node/completed:/root/completed -v /root/media-node/temp:/root/temp -v /root/media-node/queued:/root/queued rtcamp/media-node
    fi
    existing=`docker ps -a | awk '{ print $1, $(NF) }' | grep " media-node" | awk '{ print $1 }'`
    if [ ! -z $existing ]
    then
        echo "starting up existing container"
        (
            set -x
            docker start media-node
        )
        exit 0
    fi
    docker run -id --name media-node --restart=always -p 1203:1203 -v /root/media-node/completed:/root/media-node/completed -v /root/media-node/temp:/root/media-node/temp -v /root/media-node/queued:/root/media-node/queued rtcamp/media-node
}

case "$command" in
  stop)
      run_stop
      exit 0
      ;;

  logs)
      docker logs media-node
      exit 0
      ;;

  restart)
      run_stop
      run_start
      exit 0
      ;;

  start)
      run_start
      exit 0
      ;;
esac
usage
