# Live Auction App

A real-time auction bidding application where users can join with a username, place bids on items, and see updates instantly across all connected clients.

## Features

- **Real-time Bidding**: Bids update instantly using Socket.io.
- **Live Timers**: Auction countdowns are synchronized with the server.
- **Interactive UI**:
    - **Visual Feedback**: Flashing green animations for new bids, red shake animations when outbid.
    - **Status Badges**: Indicators for "Winning" or "Outbid".
- **Responsive Design**: Modern, glassmorphism-inspired UI.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js,  Socket.io
- **Containerization**: Docker


## Installation & Local Development

### 1. Clone the repository
```bash
git clone <repository-url>
cd liveauctionapp
```

### 2. Setup the Server
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```
Start the backend server (runs on port 3001):
```bash
node index.js
```

### 3. Setup the Client
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```
Start the React development server (opens on http://localhost:3000):
```bash
npm start
```

## Running with Docker

You can run the entire application (client + server) using Docker.

1. **Build the image**:
    ```bash
    docker build -t auction-app .
    ```

2. **Run the container**:
    ```bash
    docker run -p 3000:3000 -p 3001:3001 auction-app
    ```

The app will be accessible at `http://localhost:3000`, and the API/WebSocket server at `http://localhost:3001`.

## Usage

1. Open the app in your browser.
2. Enter a username to join.
3. View available auction items.
4. Click **Place Bid** to increase the current bid by $10.
5. Watch as other users bids update in real-time!
