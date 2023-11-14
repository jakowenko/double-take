# syntax = docker/dockerfile:1.4

FROM node:18 as canvas-builder
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt -y update
apt install -y build-essential libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev pax-utils ccache
ln -s /usr/bin/lddtree /usr/bin/lddtree.sh
EOT
ENV CC="ccache gcc"
ENV CXX="ccache g++"
RUN npm install -g node-gyp
ADD https://github.com/Automattic/node-canvas.git#v2.11.2 /src
WORKDIR /src
RUN npm install --ignore-scripts
RUN cp ./prebuild/Linux/binding.gyp ./binding.gyp
RUN node-gyp rebuild -j $(nproc)
RUN cd build/Release && cp `lddtree -l canvas.node | grep -v 'canvas.node'` /opt/

FROM --platform=$BUILDPLATFORM oven/bun:1.0.11 AS frontend-builder
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /build
RUN apt -y update && apt install -y --no-install-recommends curl bash unzip

COPY /frontend/package.json .
RUN bun install
COPY /frontend/src ./src
COPY /frontend/public ./public
COPY /frontend/.env.production /frontend/vue.config.js /frontend/vite.config.js /frontend/.eslintrc.js /frontend/index.html /frontend/jsconfig.json ./
RUN bun run -b build


FROM node:18 as build
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt for buildkit cache
RUN rm -f /etc/apt/apt.conf.d/docker-clean \
  && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt -y update
apt install -y curl bash jq unzip wget
 #curl -sL https://deb.nodesource.com/setup_18.x | bash -
 apt install -y gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev ccache
EOT
WORKDIR /double-take/api
COPY /api/package.json .
ENV CC="ccache gcc"
ENV CXX="ccache g++"
RUN --mount=type=cache,target=/root/.npm npm install
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
COPY --link --from=canvas-builder /opt/* /opt/lib/
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

ENV NODE_ENV=production
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
apt install -y --no-install-recommends jq
EOT

COPY --link --from=build /double-take /double-take
COPY --from=build /opt/lib/* /lib/

RUN npm install nodemon -g

ENV NODE_ENV=production
WORKDIR /double-take
COPY .build/entrypoint.sh ./
EXPOSE 3000
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
