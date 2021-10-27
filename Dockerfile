FROM node:14-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm install typescript -g
RUN yarn

RUN tsc

EXPOSE 8080

ENV NODE_ENV=prod

CMD ["node", "dist/index.js"]