const Board = require('../models/board.model');
const Card = require('../models/card.model');
const Message = require('../models/message.model');

/**
 * 1. Create a new board inside a workspace
 * POST /api/boards
 */
const createBoard = async (req, res) => {
  try {
    const { title, description, workspaceId, color, lists } = req.body;

    if (!title || !workspaceId) {
      return res.status(400).json({ message: 'title and workspaceId are required' });
    }

    // Default lists if not provided
    const defaultLists = [
      { title: 'To Do', position: 0 },
      { title: 'In Progress', position: 1 },
      { title: 'Review', position: 2 },
      { title: 'Done', position: 3 },
    ];

    const board = await Board.create({
      title,
      description: description || '',
      workspaceId,
      color: color || '#6366f1',
      lists: lists && lists.length > 0 ? lists : defaultLists,
    });

    return res.status(201).json({ message: 'Board created successfully', board });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating board', error: error.message });
  }
};

/**
 * 2. Get all boards for a specific workspace
 * GET /api/boards/workspace/:workspaceId
 */
const getBoardsByWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const boards = await Board.find({ workspaceId }).sort({ createdAt: -1 });

    return res.status(200).json({ count: boards.length, boards });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching boards', error: error.message });
  }
};

/**
 * 3. Get single board by ID
 * GET /api/boards/:id
 */
const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Sort lists by position
    board.lists.sort((a, b) => a.position - b.position);

    return res.status(200).json(board);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching board', error: error.message });
  }
};

/**
 * 4. Update board details (title, description, color)
 * PUT /api/boards/:id
 */
const updateBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    return res.status(200).json({ message: 'Board updated successfully', board });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating board', error: error.message });
  }
};

/**
 * 5. Delete board and cleanup its cards and chat messages
 * DELETE /api/boards/:id
 */
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findByIdAndDelete(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    // Cascade delete cards and chat messages
    await Card.deleteMany({ boardId: req.params.id });
    await Message.deleteMany({ boardId: req.params.id });

    return res.status(200).json({ message: 'Board and its data deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting board', error: error.message });
  }
};

/**
 * 6. Add a new list/column to a board
 * POST /api/boards/:id/lists
 */
const addList = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'List title is required' });

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const position = board.lists.length;
    board.lists.push({ title, position });
    await board.save();

    return res.status(201).json({ message: 'List added successfully', board });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding list', error: error.message });
  }
};

/**
 * 7. Update a list title or position
 * PATCH /api/boards/:id/lists/:listId
 */
const updateList = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const list = board.lists.id(req.params.listId);
    if (!list) return res.status(404).json({ message: 'List not found' });

    if (req.body.title) list.title = req.body.title;
    if (typeof req.body.position === 'number') list.position = req.body.position;

    await board.save();
    return res.status(200).json({ message: 'List updated successfully', board });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating list', error: error.message });
  }
};

/**
 * 8. Delete a list and its cards
 * DELETE /api/boards/:id/lists/:listId
 */
const deleteList = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    board.lists.pull(req.params.listId);
    await board.save();

    // Also delete any cards that were in this column
    await Card.deleteMany({ listId: req.params.listId });

    return res.status(200).json({ message: 'List deleted successfully', board });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting list', error: error.message });
  }
};

/**
 * 9. Reorder lists
 * PATCH /api/boards/:id/lists-reorder
 */
const reorderLists = async (req, res) => {
  try {
    const { lists } = req.body; // Array of { listId, position }
    if (!Array.isArray(lists)) return res.status(400).json({ message: 'lists array is required' });

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    lists.forEach(({ listId, position }) => {
      const item = board.lists.id(listId);
      if (item && typeof position === 'number') {
        item.position = position;
      }
    });

    await board.save();
    return res.status(200).json({ message: 'Lists reordered successfully', board });
  } catch (error) {
    return res.status(500).json({ message: 'Error reordering lists', error: error.message });
  }
};

module.exports = {
  createBoard,
  getBoardsByWorkspace,
  getBoardById,
  updateBoard,
  deleteBoard,
  addList,
  updateList,
  deleteList,
  reorderLists,
};
