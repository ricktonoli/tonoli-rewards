#source: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM arm64v8/node:alpine
WORKDIR /opt/rewards/src/
COPY . .
RUN npm install
CMD [ "node", "rewards.js" ]
