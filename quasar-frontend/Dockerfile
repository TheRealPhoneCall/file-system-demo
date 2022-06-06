FROM node:12-alpine as build

WORKDIR /frontend

ENV YARN_VERSION 1.21.1

RUN yarn policies set-version ${YARN_VERSION}
RUN yarn global add @quasar/cli
RUN alias python=python2
RUN apk --no-cache add g++ gcc libgcc libstdc++ linux-headers make python2
RUN npm install -g http-server

COPY package.json .
COPY yarn.lock .
RUN yarn
COPY . .

# EXPOSE 8080
# CMD [ "http-server", "dist/spa" ]
RUN quasar build