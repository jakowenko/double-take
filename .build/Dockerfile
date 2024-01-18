# syntax = docker/dockerfile:1.4

FROM --platform=$BUILDPLATFORM oven/bun:1.0.23 AS frontend-builder
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /build
RUN apt-get -y update && apt-get install -y --no-install-recommends curl bash unzip

COPY /frontend/package.json /frontend/package-lock.json ./
RUN bun install
COPY /frontend/src ./src
COPY /frontend/public ./public
COPY /frontend/vue.config.js /frontend/vite.config.js /frontend/.eslintrc.js /frontend/index.html /frontend/jsconfig.json ./
RUN bun run -b build


FROM node:18.19-bookworm as build
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt-get -y update
apt-get install -y curl bash jq unzip wget
apt-get install -y gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev ccache
EOT

WORKDIR /double-take/api
COPY /api/package.json /api/package-lock.json ./
ENV CC="ccache gcc"
ENV CXX="ccache g++"
RUN npm config set fetch-retries 20 && npm update -g npm && npm install --prefer-dedupe

WORKDIR /double-take/api
COPY /api/server.js .
COPY /api/src ./src

WORKDIR /
RUN mkdir /.storage && ln -s /.storage /double-take/.storage

WORKDIR /double-take
COPY --link --from=frontend-builder /build/dist ./frontend
RUN <<EOT
mkdir -p /opt/lib
cp /lib/*-linux-gnu*/libuuid.so.1.3.0 /opt/lib/libuuid.so.1
EOT

#COPY /.build/entrypoint.sh .

FROM node:18-slim
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt-get update
apt-get install -y --no-install-recommends jq libcairo2 libpangocairo-1.0-0 'libjpeg*turbo' libgif7 librsvg2-2
EOT

COPY --link --from=build /double-take /double-take
COPY --from=build /opt/lib/* /lib/

RUN mkdir /.storage && ln -s /.storage /double-take/.storage

RUN npm install nodemon -g

WORKDIR /double-take
COPY .build/entrypoint.sh ./
EXPOSE 3000
VOLUME [ "/.storage" ]
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
