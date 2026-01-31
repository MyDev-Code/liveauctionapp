
import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';



const SERVER_URL = window.location.origin;
const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });

const AuctionTimer = ({ endTime }) => {
  const [serverOffset, setServerOffset] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    socket.emit('SYNC_TIME', (serverTime) => {
      setServerOffset(serverTime - Date.now());
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const actualServerTime = Date.now() + serverOffset;
      const remaining = Math.max(0, endTime - actualServerTime);
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, serverOffset]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className={`timer ${timeLeft < 60000 && timeLeft > 0 ? 'timer-danger' : ''}`}>
      {timeLeft > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : "CLOSED"}
    </div>
  );
};

const AuctionCard = ({ item, userId, onPlaceBid }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevBidRef = useRef(item.currentBid);
  const prevWinningRef = useRef(item.highestBidder === userId);

  const isWinning = item.highestBidder === userId;
  const isClosed = Date.now() > item.endTime;
  const isOutbid = !isWinning && prevWinningRef.current;

  useEffect(() => {
    if (item.currentBid > prevBidRef.current) {
      setFlashClass('animate-flash-green');
      const timeout = setTimeout(() => setFlashClass(''), 800);
      return () => clearTimeout(timeout);
    }
  }, [item.currentBid]);

  useEffect(() => {
    if (prevWinningRef.current && !isWinning) {
      setFlashClass('animate-shake-red');
      const timeout = setTimeout(() => setFlashClass(''), 500);
      return () => clearTimeout(timeout);
    }
  }, [isWinning]);

  useEffect(() => {
    prevBidRef.current = item.currentBid;
    prevWinningRef.current = isWinning;
  }, [item.currentBid, isWinning]);

  return (
    <div className={`auction-card ${flashClass} ${isWinning ? 'winning-card' : ''}`}>
      <h3 className="item-title">{item.title}</h3>
      <AuctionTimer endTime={item.endTime} />
      <div className="price-tag">${item.currentBid}</div>
      <div className="status-area">
        {isWinning && <span className="winning-badge"> Winning</span>}
        {isOutbid && <span className="outbid-badge"> Outbid!</span>}
      </div>
      <button
        onClick={() => onPlaceBid(item.id, item.currentBid)}
        disabled={isClosed}
        className={`bid-button ${isWinning ? 'button-winning' : ''}`}
      >
        {isClosed ? 'Auction Ended' : 'Place Bid +$10'}
      </button>
    </div>
  );
};

export default function App() {
  const [items, setItems] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem('auction_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auction_user'));
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/items`);
        const data = await response.json();
        setItems(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    socket.on('UPDATE_BID', (updatedItem) => {
      setItems(prev => prev.map(item =>
        item.id === updatedItem.itemId
          ? { ...item, currentBid: updatedItem.newBid, highestBidder: updatedItem.highestBidder }
          : item
      ));
    });
    return () => socket.off('UPDATE_BID');
  }, []);

  const handlePlaceBid = (itemId, currentBid) => {
    socket.emit('BID_PLACED', { itemId, bidAmount: currentBid + 10, userId });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      localStorage.setItem('auction_user', usernameInput.trim());
      setUserId(usernameInput.trim());
      setIsLoggedIn(true);
    }
  };



  if (isLoading) return <div className="loader">Loading Auction...</div>;

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Live Auction</h1>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              className="login-input"
              placeholder="Enter your name"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" className="login-button">Join Auction</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="main-container">
      <header className="header">
        <h1 className="title">Live Bidding Dashboard</h1>
        <div className="user-info">
          <p className="badge">Bidding as: <strong>{userId}</strong></p>
        </div>
      </header>

      <section className="auction-grid">
        {items.map((item) => (
          <AuctionCard key={item.id} item={item} userId={userId} onPlaceBid={handlePlaceBid} />
        ))}
      </section>
    </main>
  );
}