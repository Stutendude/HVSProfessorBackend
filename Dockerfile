FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 3000 3001

CMD ["sh", "-c", "node dist/server_admin.js & node dist/server_metrics.js"]
