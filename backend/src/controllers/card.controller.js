const Card = require('../models/card.model');

// Helper to broadcast socket events if Socket.io is active
const emitSocketEvent = (req, boardId, event, data) => {
  const io = req.app.get('io');
  if (io && boardId) {
    io.to(`board_${boardId}`).emit(event, data);
  }
};

/**
 * 1. Get all cards for a specific board
 * GET /api/cards/board/:boardId
 */
const getCardsByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const cards = await Card.find({ boardId })
      .populate('assignedTo', 'name email avatar')
      .sort({ position: 1 });

    return res.status(200).json({ count: cards.length, cards });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching cards', error: error.message });
  }
};

/**
 * 2. Get single card by ID
 * GET /api/cards/:id
 */
const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).populate('assignedTo', 'name email avatar');
    if (!card) return res.status(404).json({ message: 'Card not found' });

    return res.status(200).json(card);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching card', error: error.message });
  }
};

/**
 * 3. Create a new card
 * POST /api/cards
 */
const createCard = async (req, res) => {
  try {
    const { title, boardId, listId, description, priority, tags, dueDate } = req.body;

    if (!title || !boardId || !listId) {
      return res.status(400).json({ message: 'title, boardId, and listId are required' });
    }

    // Set position as next available index in this list
    const cardCount = await Card.countDocuments({ boardId, listId });

    const card = await Card.create({
      title,
      description: description || '',
      boardId,
      listId,
      position: cardCount,
      priority: priority || 'medium',
      tags: tags || [],
      dueDate: dueDate || null,
    });

    const populatedCard = await Card.findById(card._id).populate('assignedTo', 'name email avatar');

    // Notify connected peers in real-time
    emitSocketEvent(req, boardId, 'card_created', { boardId, card: populatedCard });

    return res.status(201).json({ message: 'Card created successfully', card: populatedCard });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating card', error: error.message });
  }
};

/**
 * 4. Move a card (Drag and drop reorder or column change)
 * PATCH /api/cards/:id/move
 */
const moveCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetListId, newPosition } = req.body;

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const sourceListId = card.listId;
    if (targetListId) card.listId = targetListId;
    if (typeof newPosition === 'number') card.position = newPosition;

    await card.save();

    const populatedCard = await Card.findById(card._id).populate('assignedTo', 'name email avatar');

    // Broadcast move to all users on this board
    emitSocketEvent(req, card.boardId, 'card_moved', {
      cardId: card._id,
      sourceListId,
      targetListId: card.listId,
      newPosition: card.position,
      boardId: card.boardId,
    });

    return res.status(200).json({ message: 'Card moved successfully', card: populatedCard });
  } catch (error) {
    return res.status(500).json({ message: 'Error moving card', error: error.message });
  }
};

/**
 * 5. Update card details (title, description, priority, etc.)
 * PATCH /api/cards/:id
 */
const updateCard = async (req, res) => {
  try {
    const card = await Card.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate('assignedTo', 'name email avatar');

    if (!card) return res.status(404).json({ message: 'Card not found' });

    // Broadcast update in real-time
    emitSocketEvent(req, card.boardId, 'card_updated', { boardId: card.boardId, card });

    return res.status(200).json({ message: 'Card updated successfully', card });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating card', error: error.message });
  }
};

/**
 * 6. Delete a card
 * DELETE /api/cards/:id
 */
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    // Broadcast deletion in real-time
    emitSocketEvent(req, card.boardId, 'card_deleted', {
      boardId: card.boardId,
      cardId: card._id,
      listId: card.listId,
    });

    return res.status(200).json({ message: 'Card deleted successfully', cardId: card._id });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting card', error: error.message });
  }
};

/**
 * 7. Checklist operations (Add, Toggle, Delete)
 */
const addChecklistItem = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Checklist title is required' });

    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    card.checklists.push({ title, completed: false });
    await card.save();

    return res.status(201).json({ message: 'Checklist item added', card });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding checklist', error: error.message });
  }
};

const updateChecklistItem = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const item = card.checklists.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Checklist item not found' });

    if (req.body.title !== undefined) item.title = req.body.title;
    if (req.body.completed !== undefined) item.completed = req.body.completed;

    await card.save();
    return res.status(200).json({ message: 'Checklist item updated', card });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating checklist', error: error.message });
  }
};

const deleteChecklistItem = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    card.checklists.pull(req.params.itemId);
    await card.save();

    return res.status(200).json({ message: 'Checklist item deleted', card });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting checklist', error: error.message });
  }
};

/**
 * 8. Attachment operations (Add, Delete)
 */
const addAttachment = async (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ message: 'name and url are required' });

    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    card.attachments.push({ name, url });
    await card.save();

    return res.status(201).json({ message: 'Attachment added', card });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding attachment', error: error.message });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    card.attachments.pull(req.params.attachmentId);
    await card.save();

    return res.status(200).json({ message: 'Attachment deleted', card });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting attachment', error: error.message });
  }
};

module.exports = {
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
};
