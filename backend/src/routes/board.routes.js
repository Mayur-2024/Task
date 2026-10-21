const express = require('express');
const router = express.Router();
const {
  createBoard,
  getBoardsByWorkspace,
  getBoardById,
  updateBoard,
  deleteBoard,
  addList,
  updateList,
  deleteList,
  reorderLists,
} = require('../controllers/board.controller');
const { getBoardMessages } = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all board routes with auth middleware
router.use(protect);

// @route   POST /api/boards
// @desc    Create a new board in workspace
// @access  Private
router.post('/', createBoard);

// @route   GET /api/boards/workspace/:workspaceId
// @desc    Get all boards for a specific workspace
// @access  Private
router.get('/workspace/:workspaceId', getBoardsByWorkspace);

// @route   GET /api/boards/:id
// @desc    Get single board by ID (with sorted lists)
// @access  Private
router.get('/:id', getBoardById);

// @route   PUT /api/boards/:id
// @desc    Update board details (title, description, color)
// @access  Private
router.put('/:id', updateBoard);

// @route   DELETE /api/boards/:id
// @desc    Delete board and cascade delete cards/messages
// @access  Private
router.delete('/:id', deleteBoard);

// @route   GET /api/boards/:id/messages
// @desc    Get chat message history for board
// @access  Private
router.get('/:id/messages', getBoardMessages);

// ==========================================
// LIST (COLUMN) ROUTES
// ==========================================

// @route   POST /api/boards/:id/lists
// @desc    Add a list / column to board
// @access  Private
router.post('/:id/lists', addList);

// @route   PATCH /api/boards/:id/lists-reorder
// @desc    Reorder lists / columns within board
// @access  Private
router.patch('/:id/lists-reorder', reorderLists);

// @route   PATCH /api/boards/:id/lists/:listId
// @desc    Update a list title or position
// @access  Private
router.patch('/:id/lists/:listId', updateList);

// @route   DELETE /api/boards/:id/lists/:listId
// @desc    Delete a list and cascade delete its cards
// @access  Private
router.delete('/:id/lists/:listId', deleteList);

module.exports = router;
