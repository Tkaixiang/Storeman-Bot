# syntax=docker/dockerfile:1

FROM node:lts-alpine
RUN apk add --no-cache g++ make python3

WORKDIR /app
RUN ln -s /run/secrets/dotenv .env

COPY ["package.json", "package-lock.json", "."]
RUN npm install --production

COPY . .
RUN npx tsc

ENV NODE_ENV=production
EXPOSE 8090
CMD ["node", "index.js"]
