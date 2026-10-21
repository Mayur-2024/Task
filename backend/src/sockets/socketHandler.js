const { Server } = require('socket.io');
const Message = require('../models/message.model');
const allowedOrigins = require('../config/allowedOrigins');

// Store online users for each board: { boardId: [ { socketId, userId, name, avatar } ] }
const boardUsers = {};

const getActiveUsers = (users) => {
  const uniqueUsers = new Map();

  users.forEach(({ userId, name, avatar }) => {
    uniqueUsers.set(String(userId), { userId, name, avatar });
  });

  return Array.from(uniqueUsers.values());
};

/**
 * Initialize Socket.io on the HTTP server
 */
const initSocketServer = (httpServer, app) => {
  // 1. Create Socket.io server with CORS enabled for frontend
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Make io accessible in Express routes via req.app.get('io')
  if (app) {
    app.set('io', io);
  }

  // 2. Listen for client connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Track which boards this socket joined
    const currentBoards = new Set();

    const syncPresence = (boardId) => {
      io.to(`board_${boardId}`).emit('presence_sync', {
        boardId,
        activeUsers: getActiveUsers(boardUsers[boardId] || []),
      });
    };

    // ==========================================
    // 1. BOARD ROOM & PRESENCE
    // ==========================================

    // Join a specific board room
    socket.on('join_board', (data = {}) => {
      const { boardId, userId, user } = data;
      if (!boardId) return;

      const room = `board_${boardId}`;
      const alreadyJoined = currentBoards.has(boardId);
      socket.join(room);
      currentBoards.add(boardId);

      // Track online user info
      if (!boardUsers[boardId]) {
        boardUsers[boardId] = [];
      }

      // Add to board users list (avoid duplicates for same socket)
      const userInfo = {
        socketId: socket.id,
        userId: userId || socket.id,
        name: user?.name || 'User',
        avatar: user?.avatar || '',
      };
      boardUsers[boardId] = boardUsers[boardId].filter((u) => u.socketId !== socket.id);
      boardUsers[boardId].push(userInfo);

      if (!alreadyJoined) {
        console.log(`${userInfo.name} joined board: ${boardId}`);
      }

      syncPresence(boardId);
    });

    // Leave a board room
    socket.on('leave_board', (data = {}) => {
      const { boardId } = data;
      if (!boardId) return;

      const room = `board_${boardId}`;
      socket.leave(room);
      currentBoards.delete(boardId);

      // Remove user from the board list
      if (boardUsers[boardId]) {
        boardUsers[boardId] = boardUsers[boardId].filter((u) => u.socketId !== socket.id);
        if (boardUsers[boardId].length === 0) delete boardUsers[boardId];
        syncPresence(boardId);
      }
    });

    // ==========================================
    // 2. REAL-TIME KANBAN CARD SYNC
    // ==========================================

    // When someone moves a card
    socket.on('card_moved', (data) => {
      // Broadcast to other users on the same board
      socket.to(`board_${data.boardId}`).emit('card_moved', data);
    });

    // When someone creates a card
    socket.on('card_created', (data) => {
      socket.to(`board_${data.boardId}`).emit('card_created', data);
    });

    // When someone updates a card
    socket.on('card_updated', (data) => {
      socket.to(`board_${data.boardId}`).emit('card_updated', data);
    });

    // When someone deletes a card
    socket.on('card_deleted', (data) => {
      socket.to(`board_${data.boardId}`).emit('card_deleted', data);
    });

    // ==========================================
    // 3. TEAM CHAT & TYPING INDICATOR
    // ==========================================

    // When someone sends a chat message
    socket.on('send_message', async (data = {}, acknowledge) => {
      try {
        const { boardId, senderId, content } = data || {};
        const room = `board_${boardId}`;
        if (!boardId || !senderId || !content || !socket.rooms.has(room)) {
          acknowledge?.({ ok: false, message: 'Join the board and enter a message before sending.' });
          return;
        }

        // Save message to MongoDB
        const newMessage = await Message.create({
          boardId,
          senderId,
          content,
        });

        // Get sender details (name, avatar)
        const populatedMessage = await Message.findById(newMessage._id).populate(
          'senderId',
          'name avatar email'
        );

        // Broadcast the new message to everyone in the board room
        io.to(room).emit('new_message', populatedMessage);
        acknowledge?.({ ok: true });
      } catch (error) {
        console.error('Error saving socket message:', error.message);
        acknowledge?.({ ok: false, message: 'Message could not be sent. Please try again.' });
      }
    });

    // When someone is typing
    socket.on('user_typing', (data = {}) => {
      const { boardId, user, isTyping } = data || {};
      if (!boardId || !socket.rooms.has(`board_${boardId}`)) return;
      socket.to(`board_${boardId}`).emit('user_typing', {
        user,
        isTyping,
      });
    });

    // ==========================================
    // 4. DISCONNECT CLEANUP
    // ==========================================
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove this socket from all boards it joined
      currentBoards.forEach((boardId) => {
        if (boardUsers[boardId]) {
          boardUsers[boardId] = boardUsers[boardId].filter((u) => u.socketId !== socket.id);
          if (boardUsers[boardId].length === 0) delete boardUsers[boardId];
          syncPresence(boardId);
        }
      });
    });
  });

  return io;
};

module.exports = { initSocketServer };
