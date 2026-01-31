# Author: Christin
# Description: Docker configuration to containerize the Live Auction App.

FROM node:22-slim
WORKDIR /app

# 1. Server Setup
FROM node:22-slim
WORKDIR /app

# 1. Install dependencies first (for faster builds)
COPY server/package*.json ./server/
RUN cd server && npm install
COPY client/package*.json ./client/
RUN cd client && npm install

# 2. Build React
COPY client/ ./client/
RUN cd client && npm run build

# 3. Copy Server Code
COPY server/ ./server/

# 4. Final Start (Must be from the root /app to match our paths)
EXPOSE 10000
CMD ["node", "server/index.js"]