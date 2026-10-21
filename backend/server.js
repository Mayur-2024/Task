require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDb = require('./src/db/db');
const { initSocketServer } = require('./src/sockets/socketHandler');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDb();

// 1. Create standard Node HTTP server wrapping Express app
const server = http.createServer(app);

// 2. Initialize Socket.io on the HTTP server
const io = initSocketServer(server, app);

// 3. Start listening for incoming HTTP & WebSocket requests
server.listen(PORT, () => {
  console.log(`⚡ TaskPulse Server & Socket.io running on port: ${PORT}`);
  console.log(`📡 WebSocket endpoint ready for real-time collaboration`);
});