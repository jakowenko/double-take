FROM node:16-bullseye-slim as build
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y curl bash

WORKDIR /double-take/api
COPY /api/package.json .
RUN npm install --production

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

RUN npm cache clean -f
RUN apt install -y binutils
RUN find /double-take/ -type f -size +10M -name '*.so.*' | xargs -L1 strip -p -S 

FROM scratch
COPY --from=build . .
ENV NODE_ENV=production
WORKDIR /double-take
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]