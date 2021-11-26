#!/bin/bash

node -e 'require("./api/src/constants")()'
exec npm run api