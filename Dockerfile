FROM node:22-slim
WORKDIR /app

# Copy package files and install
COPY server/package*.json ./server/
RUN cd server && npm install
COPY client/package*.json ./client/
RUN cd client && npm install

# Build frontend
COPY client/ ./client/
RUN cd client && npm run build

# Copy backend
COPY server/ ./server/

# RUN FROM THE SERVER FOLDER
WORKDIR /app/server
CMD ["node", "index.js"]