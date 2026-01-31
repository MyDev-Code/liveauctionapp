# Author: Christin
# Description: Docker configuration to containerize the Live Auction App.

FROM node:22-slim
WORKDIR /app

# 1. Server Setup
COPY server/package*.json ./server/
RUN cd server && npm install

# 2. Client Setup
COPY client/package*.json ./client/
RUN cd client && npm install

# 3. Build React (CRITICAL STEP)
COPY client/ ./client/
RUN cd client && npm run build

# 4. Copy Server Code
COPY server/ ./server/

# 5. Start
EXPOSE 3001
WORKDIR /app/server
CMD ["node", "index.js"]