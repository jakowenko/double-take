# syntax = docker/dockerfile-upstream:master-labs
FROM python:3.9 as sqlite-web
ADD https://github.com/coleifer/sqlite-web.git /src
WORKDIR /src
RUN pip3 install pyinstaller flask pygments peewee
RUN pyinstaller --clean --onefile sqlite_web/sqlite_web.py

FROM ubuntu:20.04 as build
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
#!/bin/bash
apt -y update
apt install -y curl bash
curl -sL https://deb.nodesource.com/setup_16.x | bash -
apt install -y nodejs gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg8-dev libgif-dev jq unzip wget
EOT
WORKDIR /double-take/api
COPY /api/package.json .
ADD https://sqlite.org/2023/sqlite-amalgamation-3410000.zip /tmp/
RUN --mount=type=tmpfs,target=/src --mount=type=cache,target=/root/.npm <<EOT
#!/bin/bash
mkdir -p /src
cd /src
unzip /tmp/sqlite-amalgamation-3410000.zip && rm /tmp/sqlite-amalgamation-3410000.zip
mv sqlite* sqlite
cd sqlite
sed  -i '1i #define SQLITE_MAX_VARIABLE_NUMBER 65532' sqlite3.c

cd /double-take/api

npm install --production
curl -L -k https://gobinaries.com/tj/node-prune | /bin/sh && node-prune
EOT

WORKDIR /double-take/frontend
COPY /frontend/package.json .
RUN --mount=type=cache,target=/root/.npm npm install

WORKDIR /double-take/api
COPY /api/server.js .
COPY /api/src ./src

WORKDIR /double-take/frontend
COPY /frontend/src ./src
COPY /frontend/public ./public
COPY /frontend/.env.production /frontend/vue.config.js /frontend/babel.config.js /frontend/.eslintrc.js ./

RUN --mount=type=cache,target=/root/.npm npm run build
RUN --mount=type=tmpfs,target=/tmp mv dist /tmp/dist && rm -r * && mv /tmp/dist/* .

WORKDIR /
RUN mkdir /.storage
RUN ln -s /.storage /double-take/.storage

WORKDIR /double-take
RUN --mount=type=cache,target=/root/.npm npm install nodemon -g
COPY /.build/entrypoint.sh .

FROM ubuntu:20.04
COPY --from=build . .
COPY --from=sqlite-web /src/dist/sqlite_web /usr/local/bin/sqlite_web
ENV NODE_ENV=production
WORKDIR /double-take
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]