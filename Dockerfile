# syntax=docker/dockerfile:1

FROM node:lts-alpine
RUN apk add --no-cache g++ make python3

WORKDIR /app
RUN ln -s /run/secrets/dotenv .env

COPY . .
RUN npm install --production
RUN npx tsc

EXPOSE 8090
ENV NODE_ENV=production
CMD ["node", "index.js"]
