const Message = require('../models/message.model');

/**
 * Get all messages for a specific board
 * GET /api/messages/:boardId or GET /api/boards/:id/messages
 */
const getBoardMessages = async (req, res) => {
  try {
    const boardId = req.params.boardId || req.params.id;

    // Fetch messages for this board, sorted oldest to newest for chat order
    const messages = await Message.find({ boardId })
      .populate('senderId', 'name email avatar')
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

/**
 * Send a new message via REST API
 * POST /api/messages
 */
const createMessage = async (req, res) => {
  try {
    const { boardId, content } = req.body;

    if (!boardId || !content) {
      return res.status(400).json({ message: 'boardId and content are required' });
    }

    // Create and save message
    const newMessage = await Message.create({
      boardId,
      senderId: req.user._id,
      content,
    });

    // Populate sender details (name, avatar, email)
    const populatedMessage = await Message.findById(newMessage._id).populate(
      'senderId',
      'name email avatar'
    );

    // If socket.io is running, broadcast in real-time to the board room
    const io = req.app.get('io');
    if (io) {
      io.to(`board_${boardId}`).emit('new_message', populatedMessage);
    }

    return res.status(201).json(populatedMessage);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

module.exports = {
  getBoardMessages,
  createMessage,
};
