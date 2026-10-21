const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const allowedOrigins = require('./config/allowedOrigins');

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const boardRoutes = require('./routes/board.routes');
const cardRoutes = require('./routes/card.routes');
const messageRoutes = require('./routes/message.routes');

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/messages', messageRoutes);


// Health Check & Root Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'TaskPulse API',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.send('⚡ TaskPulse API Server is Running');
});

module.exports = app;