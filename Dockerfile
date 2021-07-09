FROM node:14-alpine
RUN apk --update add --no-cache bash python make g++ libpng libpng-dev jpeg-dev pango-dev cairo-dev giflib-dev libheif-dev
RUN apk add libimagequant-dev --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main
RUN apk add vips-dev --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

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
COPY /frontend/.env.production ./frontend/vue.config.js ./

RUN npm run build
RUN mv dist /tmp/dist && rm -r * && mv /tmp/dist/* .

WORKDIR /
RUN mkdir /.storage
RUN ln -s /.storage /double-take/.storage

WORKDIR /double-take

RUN npm install nodemon -g

CMD mkdir -p ./.storage/config && \
  echo $'# Double Take' > ./.storage/config/config.yml && \
  nodemon -e yml --watch ./.storage/config --watch ./config.yml -q api/server.js