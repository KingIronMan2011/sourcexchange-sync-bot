FROM node:24-alpine

WORKDIR /

COPY package.json pnpm-*.yaml ./

RUN npm i -g pnpm@latest

RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "start"]