#!/bin/bash

if [ "$HA_ADDON" == "true" ] && [ -f "/data/options.json" ]
then
  for s in $(echo $values | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" /data/options.json ); do
    export $s;
  done
fi

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

node -e 'require("./api/src/constants")()'
exec nodemon -e yml,yaml $PATHS -q api/server.js