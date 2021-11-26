#!/bin/bash

PATHS="";
if [ "$CONFIG_PATH" ]
then
  PATHS="$PATHS --watch "$CONFIG_PATH"";
else
  PATHS="$PATHS --watch ./.storage/config";
fi

if [ "$SECRETS_PATH" ]
then
  PATHS="$PATHS --watch "$SECRETS_PATH"";
elif [ "$CONFIG_PATH" ]
then
  PATHS="$PATHS --watch ./.storage/config";
fi

exec nodemon -e yml $PATHS -q api/server.js