# syntax=docker/dockerfile:1

FROM node:lts-alpine AS base

RUN npm install -g npm@latest


FROM base AS npm

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache g++ make python3

COPY ["package.json", "package-lock.json", "."]
RUN npm ci


FROM base AS app

WORKDIR /app
ENV NODE_ENV=production

COPY --from=npm /app/node_modules ./node_modules
COPY . .

RUN ln -s /run/secrets/dotenv .env
RUN npx tsc

EXPOSE 8090
CMD ["node", "index.js"]
