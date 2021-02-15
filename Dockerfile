FROM node:12-alpine
WORKDIR /app
COPY ./ /app
RUN npm install --production
CMD [ "node", "server.js" ]