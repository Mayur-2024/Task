const Workspace = require('../models/workspace.model');
const Board = require('../models/board.model');
const Card = require('../models/card.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');

/**
 * 1. Create a new workspace
 * POST /api/workspaces
 */
const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      description: description || '',
      ownerId: req.user._id,
      members: [
        {
          userId: req.user._id,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
    });

    return res.status(201).json({ message: 'Workspace created successfully', workspace });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating workspace', error: error.message });
  }
};

/**
 * 2. Get all workspaces for current logged-in user
 * GET /api/workspaces
 */
const getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { ownerId: req.user._id },
        { 'members.userId': req.user._id },
      ],
    })
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: workspaces.length, workspaces });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching workspaces', error: error.message });
  }
};

/**
 * 3. Get workspace by ID with its boards
 * GET /api/workspaces/:id
 */
const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const boards = await Board.find({ workspaceId: req.params.id });

    return res.status(200).json({ workspace, boards });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching workspace', error: error.message });
  }
};

/**
 * 4. Update workspace details (name, description)
 * PUT /api/workspaces/:id
 */
const updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    return res.status(200).json({ message: 'Workspace updated successfully', workspace });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating workspace', error: error.message });
  }
};

/**
 * 5. Delete workspace and cascade delete its boards, cards, and messages
 * DELETE /api/workspaces/:id
 */
const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Find and delete all boards in this workspace
    const boards = await Board.find({ workspaceId: req.params.id });
    const boardIds = boards.map((b) => b._id);

    await Card.deleteMany({ boardId: { $in: boardIds } });
    await Message.deleteMany({ boardId: { $in: boardIds } });
    await Board.deleteMany({ workspaceId: req.params.id });

    return res.status(200).json({ message: 'Workspace and its boards/cards deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting workspace', error: error.message });
  }
};

/**
 * 6. Add / Invite a member by email
 * POST /api/workspaces/:id/members
 */
const addMember = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ message: 'User email is required' });

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'No user found with this email' });

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    // Check if user is already a member
    const alreadyMember = workspace.members.some(
      (m) => m.userId.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }

    workspace.members.push({ userId: userToAdd._id, role, joinedAt: new Date() });
    await workspace.save();

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    return res.status(200).json({ message: 'Member added successfully', workspace: populatedWorkspace });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding member', error: error.message });
  }
};

/**
 * 7. Update member role
 * PATCH /api/workspaces/:id/members/:memberId
 */
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const member = workspace.members.find(
      (m) => m.userId.toString() === req.params.memberId
    );
    if (!member) return res.status(404).json({ message: 'Member not found in workspace' });

    member.role = role || member.role;
    await workspace.save();

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    return res.status(200).json({ message: 'Member role updated', workspace: populatedWorkspace });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating role', error: error.message });
  }
};

/**
 * 8. Remove member from workspace
 * DELETE /api/workspaces/:id/members/:memberId
 */
const removeMember = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    workspace.members = workspace.members.filter(
      (m) => (m.userId._id ? m.userId._id.toString() : m.userId.toString()) !== req.params.memberId
    );
    await workspace.save();

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    return res.status(200).json({ message: 'Member removed from workspace', workspace: populatedWorkspace });
  } catch (error) {
    return res.status(500).json({ message: 'Error removing member', error: error.message });
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  updateMemberRole,
  removeMember,
};
