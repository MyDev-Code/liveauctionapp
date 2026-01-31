FROM node:22-slim
WORKDIR /app


COPY server/package*.json ./server/
RUN cd server && npm install
COPY client/package*.json ./client/
RUN cd client && npm install


COPY client/ ./client/
RUN cd client && npm run build


COPY server/ ./server/


WORKDIR /app/server
CMD ["node", "index.js"]