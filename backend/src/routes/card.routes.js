const express = require('express');
const router = express.Router();
const {
  getCardsByBoard,
  getCardById,
  createCard,
  moveCard,
  updateCard,
  deleteCard,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addAttachment,
  deleteAttachment,
} = require('../controllers/card.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all card routes with auth middleware
router.use(protect);

// @route   POST /api/cards
// @desc    Create new card
// @access  Private
router.post('/', createCard);

// @route   GET /api/cards/board/:boardId
// @desc    Get all cards for a board (ordered by position)
// @access  Private
router.get('/board/:boardId', getCardsByBoard);

// @route   GET /api/cards/:id
// @desc    Get single card by ID
// @access  Private
router.get('/:id', getCardById);

// @route   PATCH /api/cards/:id/move
// @desc    Move card (same list reorder or cross-list transfer)
// @access  Private
router.patch('/:id/move', moveCard);

// @route   PATCH /api/cards/:id
// @desc    Update card metadata
// @access  Private
router.patch('/:id', updateCard);

// @route   DELETE /api/cards/:id
// @desc    Delete card
// @access  Private
router.delete('/:id', deleteCard);

// ==========================================
// CHECKLIST ROUTES
// ==========================================

// @route   POST /api/cards/:id/checklists
// @desc    Add item to card checklist
// @access  Private
router.post('/:id/checklists', addChecklistItem);

// @route   PATCH /api/cards/:id/checklists/:itemId
// @desc    Toggle or update card checklist item
// @access  Private
router.patch('/:id/checklists/:itemId', updateChecklistItem);

// @route   DELETE /api/cards/:id/checklists/:itemId
// @desc    Delete item from card checklist
// @access  Private
router.delete('/:id/checklists/:itemId', deleteChecklistItem);

// ==========================================
// ATTACHMENT ROUTES
// ==========================================

// @route   POST /api/cards/:id/attachments
// @desc    Add attachment to card
// @access  Private
router.post('/:id/attachments', addAttachment);

// @route   DELETE /api/cards/:id/attachments/:attachmentId
// @desc    Delete attachment from card
// @access  Private
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

module.exports = router;
