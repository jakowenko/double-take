# syntax = docker/dockerfile:1.4

FROM --platform=$BUILDPLATFORM oven/bun:1.0.20 AS frontend-builder
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /build
RUN apt-get update -y && apt-get install -y --no-install-recommends curl bash unzip \
    && rm -rf /var/lib/apt/lists/*

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

# Cache and layer sharing for package installations through BuildKit
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked <<EOT
apt-get update -y
apt-get install -y --no-install-recommends curl bash jq unzip wget gcc g++ make libpixman-1-dev libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev ccache \
rm -rf /var/lib/apt/lists/*
EOT
WORKDIR /double-take/api
COPY /api/package.json .
ENV CC="ccache gcc"
ENV CXX="ccache g++"
RUN npm config set fetch-retries 20 && npm install -g npm@latest && npm ci --prefer-offline

COPY /api/server.js .
COPY /api/src ./src

RUN ln -s /.storage /double-take/.storage -p

WORKDIR /double-take
# Copy the compiled frontend assets using the --link flag to avoid duplicate data
COPY --link --from=frontend-builder /build/dist ./frontend
RUN npm install nodemon -g && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /opt/lib
RUN cp /lib/*-linux-gnu*/libuuid.so.1.3.0 /opt/lib/libuuid.so.1

FROM node:18-slim
ARG DEBIAN_FRONTEND=noninteractive
# Prepare apt with caching enabled
RUN echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache

# Install runtime dependencies with cache mounts and clear the apt cache after install
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked --mount=type=cache,target=/var/lib/apt,sharing=locked apt-get update -y \
    && apt-get install -y --no-install-recommends jq libcairo2 libpangocairo-1.0-0 'libjpeg*turbo' libgif7 librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copying from build stage directly rather than copying the libraries one by one
COPY --link --from=build /double-take /double-take
# This step is already performed in the build stage
# RUN npm install -g nodemon

# Create symbolic links
RUN ln -s /.storage /double-take/.storage -p

WORKDIR /double-take
COPY .build/entrypoint.sh ./
EXPOSE 3000
VOLUME ["/.storage"]
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
