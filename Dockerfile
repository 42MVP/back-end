FROM node:20-alpine3.17 AS development
WORKDIR /app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm ci --legacy-peer-deps

COPY . .

CMD [ "npm", "run", "start:dev" ]

FROM development AS build

RUN npm run build

CMD [ "node", "./dist/main.js" ]

