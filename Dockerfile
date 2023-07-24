FROM node:20-alpine3.17 AS development
WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN yarn install --frozen-lockfile

COPY . .

CMD [ "yarn", "start:dev" ]

FROM development AS build

RUN yarn build

CMD [ "node", "./dist/main.js" ]

