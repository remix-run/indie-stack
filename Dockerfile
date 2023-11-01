FROM node:20-alpine as base

ARG PERSONAL_ACCESS_TOKEN

ENV APP_DIR /usr/local/app

RUN apk add --no-cache libc6-compat

# Set github registry access
RUN npm config set //npm.pkg.github.com/:_authToken $PERSONAL_ACCESS_TOKEN
RUN npm config set @paystackhq:registry https://npm.pkg.github.com

WORKDIR $APP_DIR

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS release

ENV APP_DIR /usr/local/app

WORKDIR $APP_DIR

COPY --from=base $APP_DIR/package.json ./
COPY --from=base $APP_DIR/node_modules ./node_modules
COPY --from=base $APP_DIR/build ./build
COPY --from=base $APP_DIR/public ./public

EXPOSE 3000

ARG APP_VERSION
ENV DD_VERSION ${APP_VERSION}

CMD ["npm", "start"]