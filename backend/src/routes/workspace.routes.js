const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  updateMemberRole,
  removeMember,
} = require('../controllers/workspace.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all workspace routes with auth middleware
router.use(protect);

// @route   POST /api/workspaces
// @desc    Create a new workspace
// @access  Private
router.post('/', createWorkspace);

// @route   GET /api/workspaces
// @desc    Get all workspaces for current user
// @access  Private
router.get('/', getUserWorkspaces);

// @route   GET /api/workspaces/:id
// @desc    Get workspace by ID with boards
// @access  Private
router.get('/:id', getWorkspaceById);

// @route   PUT /api/workspaces/:id
// @desc    Update workspace details
// @access  Private (Owner/Admin)
router.put('/:id', updateWorkspace);

// @route   DELETE /api/workspaces/:id
// @desc    Delete workspace and cascade clean boards/cards
// @access  Private (Owner only)
router.delete('/:id', deleteWorkspace);

// @route   POST /api/workspaces/:id/members
// @desc    Add / invite member to workspace
// @access  Private (Owner/Admin)
router.post('/:id/members', addMember);

// @route   PATCH /api/workspaces/:id/members/:memberId
// @desc    Update member role in workspace
// @access  Private (Owner/Admin)
router.patch('/:id/members/:memberId', updateMemberRole);

// @route   DELETE /api/workspaces/:id/members/:memberId
// @desc    Remove member from workspace / Leave workspace
// @access  Private (Owner/Admin/Self)
router.delete('/:id/members/:memberId', removeMember);

module.exports = router;
