const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// 1. Initialize Server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// 2. Define the path to your React files (one level up from /server)
const buildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(buildPath));

// 3. Auction Data
const AUCTION_END_TIME = Date.now() + 10 * 60 * 1000;

let auctions = [
  {
    id: 1,
    title: "Vintage Watch",
    currentBid: 100,
    highestBidder: null,
    endTime: AUCTION_END_TIME
  },
  {
    id: 2,
    title: "Retro Camera",
    currentBid: 250,
    highestBidder: null,
    endTime: AUCTION_END_TIME
  }
];

// 4. API Routes
app.get('/items', (req, res) => {
  res.status(200).json(auctions);
});

// 5. Socket.io Logic
io.on('connection', (socket) => {
  console.log(`New Connection: ${socket.id}`);

  socket.on('BID_PLACED', (incomingBid) => {
    const { itemId, bidAmount, userId } = incomingBid;
    const item = auctions.find(a => a.id === itemId);

    if (!item) return socket.emit('ERROR', 'Item not found');

    const now = Date.now();
    const isAuctionOver = now > item.endTime;
    const isBidTooLow = bidAmount <= item.currentBid;

    if (isAuctionOver) {
      return socket.emit('ERROR', 'This auction has already closed.');
    }

    if (isBidTooLow) {
      return socket.emit('OUTBID', {
        message: 'Someone else just placed a higher bid!',
        currentBid: item.currentBid
      });
    }

    item.currentBid = bidAmount;
    item.highestBidder = userId;

    io.emit('UPDATE_BID', {
      itemId: item.id,
      newBid: item.currentBid,
      highestBidder: item.highestBidder
    });
  });

  socket.on('SYNC_TIME', (callback) => {
    callback(Date.now());
  });

  socket.on('disconnect', () => {
    console.log(`User left: ${socket.id}`);
  });
});

// 6. THE CATCH-ALL ROUTE (MUST BE LAST)
// This serves the React app for any route that isn't /items
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// 7. Start Server
const PORT = process.env.PORT || 3001;

// Change THIS line:
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Auction Server is live on port ${PORT}`);
});