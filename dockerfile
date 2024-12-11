FROM node:23-alpine

WORKDIR /app
RUN apk add --no-cache openssl

COPY . /app

RUN yarn install

CMD ["yarn", "run", "watch"]
