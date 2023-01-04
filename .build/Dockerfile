# syntax = docker/dockerfile-upstream:master-labs
FROM ubuntu:20.04 as build
ARG DEBIAN_FRONTEND=noninteractive

RUN --mount=type=tmpfs,target=/var/cache/apt <<EOT
#!/bin/bash
apt-get update && apt-get install -y curl bash
curl -sL https://deb.nodesource.com/setup_16.x | bash -
apt-get install -y nodejs gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg8-dev libgif-dev jq unzip wget
EOT
WORKDIR /double-take/api
COPY /api/package.json .
RUN --mount=type=tmpfs,target=/src <<EOT
#!/bin/bash
mkdir -p /src
cd /src
wget https://sqlite.org/2022/sqlite-amalgamation-3380500.zip
unzip sqlite-amalgamation-3380500.zip && rm sqlite-amalgamation-3380500.zip
mv sqlite* sqlite
cd sqlite
sed  -i '1i #define SQLITE_MAX_VARIABLE_NUMBER 65532' sqlite3.c

cd /double-take/api
npm install --production
curl -L https://gobinaries.com/tj/node-prune | /bin/sh && node-prune
EOT

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
RUN --mount=type=tmpfs,target=/tmp mv dist /tmp/dist && rm -r * && mv /tmp/dist/* .

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