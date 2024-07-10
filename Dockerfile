FROM node:18.18.0-alpine AS builder

WORKDIR /usr/src/app

COPY . .

RUN apk add git && yarn install \
  --prefer-offline \
  --frozen-lockfile \
  --non-interactive \
  --production=false

RUN yarn run build

FROM node:18.18.0-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

ADD Makefile .
ADD package.json .
ADD *.lock .

RUN apk add --no-cache \
  openssl \
  git \
  jq \
  nano

RUN yarn install \
  --prefer-offline \
  --pure-lockfile \
  --non-interactive \
  --production=true

#COPY . .

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 7000

CMD ["yarn", "start:prod"]
