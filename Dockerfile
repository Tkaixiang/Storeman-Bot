# syntax=docker/dockerfile:1

FROM node:lts-alpine AS base

WORKDIR /app/
ENV NODE_ENV=production

RUN npm install -g npm@latest


FROM base AS npm

RUN apk add --no-cache g++ make python3

COPY ["package.json", "package-lock.json", "./"]
RUN npm ci


FROM base AS app

COPY --from=npm /app/node_modules ./node_modules
COPY . .
RUN npx tsc

ENV NODE_ENV=development

EXPOSE 8090
CMD ["node", "index.js"]
