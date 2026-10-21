const express = require('express');
const router = express.Router();
const {
  getBoardMessages,
  createMessage,
} = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all message routes with JWT
router.use(protect);

// GET /api/messages/:boardId (or /api/messages/board/:boardId)
router.get('/:boardId', getBoardMessages);
router.get('/board/:boardId', getBoardMessages);

// POST /api/messages
router.post('/', createMessage);

module.exports = router;
