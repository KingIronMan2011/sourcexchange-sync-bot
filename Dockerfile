FROM node:24-alpine

WORKDIR /

COPY package.json pnpm-*.yaml ./

RUN npm i -g pnpm@11.25.0

RUN pnpm install --frozen-lockfile --prod

COPY . .

CMD ["pnpm", "start"]