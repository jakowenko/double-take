FROM node:12-alpine
RUN apk add --no-cache bash
WORKDIR /app
COPY ./ /app
RUN npm install --production
CMD [ "node", "server.js" ]