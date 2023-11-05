# syntax=docker/dockerfile:1

FROM node:lts-alpine AS base

WORKDIR /app/
ENV NODE_ENV=production


FROM base AS npm

RUN apk add --no-cache g++ make python3

COPY ["package.json", "package-lock.json", "./"]
RUN npm ci


FROM base AS app

COPY --from=npm /app/node_modules ./node_modules
COPY . .
RUN npx tsc

EXPOSE 80
CMD ["node", "index.js"]
