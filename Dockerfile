FROM node:12-alpine
RUN apk add --no-cache bash python make g++
RUN mkdir /.storage
WORKDIR /app
COPY ./ /app
RUN npm install --production
RUN ln -s /.storage /app/.storage
CMD [ "node", "server.js" ]