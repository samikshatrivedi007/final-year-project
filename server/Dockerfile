FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

RUN mkdir -p uploads

EXPOSE 9000

CMD ["node", "dist/app.js"]
