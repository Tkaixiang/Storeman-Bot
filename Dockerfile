# syntax=docker/dockerfile:1

FROM node:lts-alpine AS base

WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g npm@latest


FROM base AS npm

RUN apk add --no-cache g++ make python3

COPY ["package.json", "package-lock.json", "."]
RUN npm ci


FROM base AS app

COPY --from=npm /app/node_modules ./node_modules
COPY . .
RUN npx tsc
RUN npm install pm2@latest -g

EXPOSE 8090
CMD ["pm2-runtime", "index.js"]
