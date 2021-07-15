#!/bin/bash

mkdir -p ./.storage/config
[ -f ./.storage/config/config.yml ] || echo $'# Double Take' > ./.storage/config/config.yml
exec npm run api