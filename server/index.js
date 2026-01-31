

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});


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



app.get('/items', (req, res) => {
  res.status(200).json(auctions);
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

io.on('connection', (socket) => {
  console.log(`New Connection: ${socket.id}`);

  socket.on('BID_PLACED', (incomingBid) => {
    const { itemId, bidAmount, userId } = incomingBid;

    const item = auctions.find(a => a.id === itemId);

    if (!item) {
      return socket.emit('ERROR', 'Item not found');
    }

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

    console.log(`Success: ${userId} bid $${bidAmount} on ${item.title}`);

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
     Auction Server is live!
     Port: ${PORT}
     URL: http://localhost:${PORT}
  `);
});