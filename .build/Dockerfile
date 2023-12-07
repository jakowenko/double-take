# syntax = docker/dockerfile:1.4

FROM --platform=$BUILDPLATFORM oven/bun:1.0.15 AS frontend-builder
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /build
RUN apt-get -y update && apt-get install -y --no-install-recommends curl bash unzip

COPY /frontend/package.json .
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
apt -y update
apt install -y curl bash jq unzip wget
apt install -y gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev ccache
EOT
WORKDIR /double-take/api
COPY /api/package.json .
ENV CC="ccache gcc"
ENV CXX="ccache g++"
RUN npm config set fetch-retries 20 && npm install -g npm@^10.2.4 && npm install

WORKDIR /double-take/api
COPY /api/server.js .
COPY /api/src ./src

WORKDIR /
RUN mkdir /.storage && ln -s /.storage /double-take/.storage

WORKDIR /double-take
COPY --link --from=frontend-builder /build/dist ./frontend
RUN npm install nodemon -g
RUN mkdir -p /opt/lib
RUN cp /lib/*-linux-gnu*/libuuid.so.1.3.0 /opt/lib/libuuid.so.1

#COPY /.build/entrypoint.sh .

FROM node:18 as debug
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache
COPY --link --from=build /double-take /double-take
COPY --from=build /opt/lib/* /lib/

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt update
apt install -y --no-install-recommends dnsutils inetutils-ping inetutils-traceroute net-tools curl jq
EOT

RUN npm install nodemon -g

WORKDIR /double-take
EXPOSE 3000
COPY .build/entrypoint.sh ./
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]

FROM node:18-slim
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt update
apt install -y --no-install-recommends jq libcairo2 libpangocairo-1.0-0 'libjpeg*turbo' libgif7 librsvg2-2
EOT

COPY --link --from=build /double-take /double-take
COPY --from=build /opt/lib/* /lib/

RUN npm install nodemon -g

WORKDIR /double-take
COPY .build/entrypoint.sh ./
EXPOSE 3000
VOLUME [ "/.storage" ]
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
