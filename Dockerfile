FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY database /app/database
RUN npm run build
EXPOSE 10000
CMD ["npm","start"]
