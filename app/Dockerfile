FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts
COPY telemetry.js server.js ./
USER node
EXPOSE 8080
CMD ["node", "-r", "./telemetry.js", "server.js"]
