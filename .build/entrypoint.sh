#!/bin/bash

mkdir -p ./.storage/config
[ -f ./.storage/config/config.yml ] || echo $'# Double Take' > ./.storage/config/config.yml
exec nodemon -e yml --watch ./.storage/config --watch ./config.yml -q api/server.js