FROM node:12-alpine
RUN apk --update add --no-cache bash python perl make g++ libpng libpng-dev jpeg-dev pango-dev cairo-dev giflib-dev
RUN apk add libimagequant-dev --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main
RUN apk add vips-dev --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community
RUN mkdir /.storage
WORKDIR /app
COPY ./ /app
RUN npm install --production
RUN ln -s /.storage /app/.storage
CMD [ "node", "server.js" ]