FROM node:24-alpine

WORKDIR /

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["npm", "start"]