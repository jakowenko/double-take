# syntax = docker/dockerfile-upstream:master-labs
FROM ubuntu:20.04 as build
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y curl bash
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg8-dev libgif-dev jq

WORKDIR /src/sqlite
ADD https://github.com/WiseLibs/better-sqlite3/raw/v7.5.3/deps/sqlite3/sqlite3.c .
ADD https://github.com/WiseLibs/better-sqlite3/raw/v7.5.3/deps/sqlite3/sqlite3.h .
ADD https://github.com/WiseLibs/better-sqlite3/raw/v7.5.3/deps/sqlite3/sqlite3ext.h .

RUN <<EOT
#!/bin/bash
echo -e "#define SQLITE_MAX_VARIABLE_NUMBER 65532\n$(cat sqlite3.c)" > sqlite3.c
EOT
WORKDIR /double-take/api
COPY /api/package.json .
RUN npm install --production
RUN curl -L https://gobinaries.com/tj/node-prune | /bin/sh && node-prune

WORKDIR /double-take/frontend
COPY /frontend/package.json .
RUN npm install

WORKDIR /double-take/api
COPY /api/server.js .
COPY /api/src ./src

WORKDIR /double-take/frontend
COPY /frontend/src ./src
COPY /frontend/public ./public
COPY /frontend/.env.production /frontend/vue.config.js /frontend/babel.config.js /frontend/.eslintrc.js ./

RUN npm run build
RUN mv dist /tmp/dist && rm -r * && mv /tmp/dist/* .

WORKDIR /
RUN mkdir /.storage
RUN ln -s /.storage /double-take/.storage

WORKDIR /double-take
RUN npm install nodemon -g
COPY /.build/entrypoint.sh .

FROM ubuntu:20.04
COPY --from=build . .
ENV NODE_ENV=production
WORKDIR /double-take
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]