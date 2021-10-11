FROM node:14-bullseye

RUN apt-get update && apt-get install -y libcairo2-dev libpango1.0-dev libvips-dev

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
COPY /frontend/.env.production /frontend/vue.config.js /frontend/babel.config.js ./

RUN npm run build
RUN mv dist /tmp/dist && rm -r * && mv /tmp/dist/* .

WORKDIR /
RUN mkdir /.storage
RUN ln -s /.storage /double-take/.storage

WORKDIR /double-take

RUN npm install nodemon -g

COPY /.build/entrypoint.sh .

ENV NODE_ENV=production

ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]