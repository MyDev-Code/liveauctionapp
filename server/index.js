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

const buildPath = path.join(__dirname, '../client/build');
app.use(express.static(buildPath));

const fs = require('fs');

const DATA_FILE = path.join(__dirname, 'auction_data.json');

const AUCTION_END_TIME = Date.now() + 5 * 60 * 1000;
const INITIAL_AUCTIONS = [
  { id: 1, title: "Vintage Watch", currentBid: 100, highestBidder: null, endTime: AUCTION_END_TIME },
  { id: 2, title: "Retro Camera", currentBid: 250, highestBidder: null, endTime: AUCTION_END_TIME }
];

let auctions = [];

try {
  if (fs.existsSync(DATA_FILE)) {
    auctions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } else {
    auctions = INITIAL_AUCTIONS;
    fs.writeFileSync(DATA_FILE, JSON.stringify(auctions));
  }
} catch (err) {
  console.error("Error loading data:", err);
  auctions = INITIAL_AUCTIONS;
}

const saveAuctions = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(auctions, null, 2));
  } catch (err) {
    console.error("Error saving data:", err);
  }
};

app.get('/items', (req, res) => res.status(200).json(auctions));

io.on('connection', (socket) => {
  socket.on('BID_PLACED', (bid) => {
    const item = auctions.find(a => a.id === bid.itemId);
    if (!item || bid.bidAmount <= item.currentBid || Date.now() > item.endTime) return;
    item.currentBid = bid.bidAmount;
    item.highestBidder = bid.userId;
    console.log(`Bid placed: User "${bid.userId}" bid $${bid.bidAmount} on "${item.title}"`);
    saveAuctions();
    io.emit('UPDATE_BID', { itemId: item.id, newBid: item.currentBid, highestBidder: item.highestBidder });
  });
  socket.on('SYNC_TIME', (cb) => cb(Date.now()));
});


app.get('*path', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});


const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server live on port ${PORT}`);
});