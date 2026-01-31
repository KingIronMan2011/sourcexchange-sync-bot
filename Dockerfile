FROM node:24-bullseye-slim

WORKDIR /

COPY package*.json ./

RUN npm i -g npm@latest

RUN npm ci --only=production

COPY . .

CMD ["npm", "start"]