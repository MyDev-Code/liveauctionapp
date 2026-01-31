# Author: Christin
# Description: Docker configuration to containerize the Live Auction App.

FROM node:20-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install
COPY client/package*.json ./client/
RUN cd client && npm install
COPY . .
EXPOSE 3000
EXPOSE 3001
CMD ["sh", "-c", "cd server && node index.js & cd client && npm start"]