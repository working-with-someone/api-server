FROM node:23-alpine

WORKDIR /app

COPY . /app

RUN yarn install
RUN yarn run compile

CMD ["yarn", "run", "start"]
