# syntax = docker/dockerfile-upstream:master-labs
FROM python:3.9 as sqlite-web
ADD https://github.com/coleifer/sqlite-web.git /src
WORKDIR /src
RUN pip3 install pyinstaller flask pygments peewee
RUN pyinstaller --clean --onefile sqlite_web/sqlite_web.py

FROM node:16 as better-sqlite3-builder
ARG DEBIAN_FRONTEND=noninteractive
ADD https://sqlite.org/2023/sqlite-amalgamation-3410000.zip /tmp/
WORKDIR /build
RUN --mount=type=cache,target=/root/.npm <<EOT
  #!/bin/bash
  mkdir -p /src
  cd /src
  unzip /tmp/sqlite-amalgamation-3410000.zip && rm /tmp/sqlite-amalgamation-3410000.zip
  mv sqlite* sqlite
  cd sqlite
  sed  -i '1i #define SQLITE_MAX_VARIABLE_NUMBER 65532' sqlite3.c
EOT
RUN npm install --build-from-source --install-links better-sqlite3@'^8.2.0' --sqlite3="/src/sqlite"


FROM node:16 as canvas-builder
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt -y update
apt install -y build-essential libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev pax-utils
ln -s /usr/bin/lddtree /usr/bin/lddtree.sh
EOT
RUN npm install -g node-gyp
ADD https://github.com/Automattic/node-canvas.git#v2.11.2 /src
WORKDIR /src
RUN npm install --ignore-scripts
RUN cp ./prebuild/Linux/binding.gyp ./binding.gyp
RUN node-gyp rebuild -j $(nproc)
RUN bash ./prebuild/Linux/bundle.sh

FROM --platform=$BUILDPLATFORM node:16 AS frontend-builder
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /build
RUN apt -y update && apt install -y --no-install-recommends curl bash unzip
ENV BUN_INSTALL /usr/local/
RUN curl -fsSL https://bun.sh/install | bash
COPY /frontend/package.json .
RUN --mount=type=cache,target=/root/.npm bun install --cache-dir=/root/.npm/_buncache
COPY /frontend/src ./src
COPY /frontend/public ./public
COPY /frontend/.env.production /frontend/vue.config.js /frontend/vite.config.js /frontend/.eslintrc.js /frontend/index.html ./
RUN --mount=type=cache,target=/root/.npm npm run build


FROM node:16 as build
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt -y update
apt install -y curl bash jq unzip wget
 #curl -sL https://deb.nodesource.com/setup_16.x | bash -
 apt install -y gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev
EOT
WORKDIR /double-take/api
COPY /api/package.json .

RUN --mount=type=cache,target=/root/.npm npm install
COPY --link --from=better-sqlite3-builder /build/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --link --from=canvas-builder /src ./node_modules/canvas

WORKDIR /double-take/api
COPY /api/server.js .
COPY /api/src ./src

WORKDIR /
RUN mkdir /.storage && ln -s /.storage /double-take/.storage

WORKDIR /double-take
COPY --link --from=frontend-builder /build/dist ./frontend
RUN --mount=type=cache,target=/root/.npm npm install nodemon -g
RUN mkdir -p /opt/lib
RUN cp /lib/`uname -m`-linux-gnu/libuuid.so.1.3.0 /opt/lib/libuuid.so.1
#COPY /.build/entrypoint.sh .

#COPY --from=sqlite-web /src/dist/sqlite_web /usr/local/bin/sqlite_web

FROM gcr.io/distroless/nodejs16-debian11
COPY --link --from=build /double-take /double-take
COPY --from=build /opt/lib/* /lib/

ENV NODE_ENV=production
WORKDIR /double-take
EXPOSE 3000
CMD ["api/server.js"]
