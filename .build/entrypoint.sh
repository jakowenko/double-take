#!/bin/bash

if [ "$CONFIG_PATH" ]
then
  mkdir -p "$CONFIG_PATH"
  [ -f "$CONFIG_PATH"/config.yml ] || echo $'# Double Take' > "$CONFIG_PATH"/config.yml
  exec nodemon -e yml --watch "$CONFIG_PATH" -q api/server.js
else
  mkdir -p ./.storage/config
  [ -f ./.storage/config/config.yml ] || echo $'# Double Take' > ./.storage/config/config.yml
  exec nodemon -e yml --watch ./.storage/config --watch ./config.yml -q api/server.js
fi