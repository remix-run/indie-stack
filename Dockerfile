FROM node:16-alpine as base

ARG PERSONAL_ACCESS_TOKEN

ENV APP_DIR /usr/local/app

RUN apk add --no-cache libc6-compat

# Set github registry access
RUN npm config set //npm.pkg.github.com/:_authToken $PERSONAL_ACCESS_TOKEN
RUN npm config set @paystackhq:registry https://npm.pkg.github.com

WORKDIR $APP_DIR

COPY package*.json yarn.lock ./
RUN npm install
COPY . .
RUN npm run build

FROM node:16-alpine AS release

ENV APP_DIR /usr/local/app

WORKDIR $APP_DIR

COPY --from=base $APP_DIR/*.json $APP_DIR/*.js $APP_DIR/*.ts ./
COPY --from=base $APP_DIR/node_modules ./node_modules
COPY --from=base $APP_DIR/build ./build
COPY --from=base $APP_DIR/app ./app
COPY --from=base $APP_DIR/public ./public

EXPOSE 4202

ARG APP_VERSION
ENV DD_VERSION ${APP_VERSION}

CMD ["yarn", "start"]