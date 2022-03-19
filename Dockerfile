FROM node:17-slim

RUN apt-get update \
  && apt-get install -y sox libsox-fmt-mp3 \
  && npm install -g npm@8.5.5


WORKDIR /home/node/spotfy-radio/

COPY package.json package-lock.json /home/node/spotfy-radio/

RUN npm ci --silent

COPY . .

#USER node

CMD npm run live-reload