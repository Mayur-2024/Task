import React, { useState } from 'react';

export default function Navbar({
  user,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  boards,
  activeBoard,
  onSelectBoard,
  onCreateBoard,
  onlineUsers,
  onToggleChat,
  isChatOpen,
  onOpenMembers,
  onLogout,
}) {
  const [showWorkspaceInput, setShowWorkspaceInput] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showBoardInput, setShowBoardInput] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setShowWorkspaceInput(false);
    }
  };

  const handleCreateBoard = (e) => {
    e.preventDefault();
    if (newBoardTitle.trim()) {
      onCreateBoard(newBoardTitle.trim());
      setNewBoardTitle('');
      setShowBoardInput(false);
    }
  };

  return (
    <header className="navbar glass-panel">
      <div className="navbar-left">
        {/* Logo */}
        <div className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">TaskPulse</span>
        </div>

        {/* Workspace Selector */}
        <div className="nav-selector-group">
          <span className="nav-label">🏢 Workspace:</span>
          <select
            className="nav-select"
            value={activeWorkspace?._id || ''}
            onChange={(e) => {
              const ws = workspaces.find((w) => w._id === e.target.value);
              if (ws) onSelectWorkspace(ws);
            }}
          >
            {workspaces.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            className="btn-icon"
            title="Create Workspace"
            onClick={() => setShowWorkspaceInput(!showWorkspaceInput)}
          >
            ➕
          </button>
          <button
            className="btn-nav-action"
            title="Manage Workspace Members"
            onClick={onOpenMembers}
          >
            👥 Members ({activeWorkspace?.members?.length || 1})
          </button>
        </div>

        {/* Board Selector */}
        {activeWorkspace && (
          <div className="nav-selector-group">
            <span className="nav-label">📋 Board:</span>
            <select
              className="nav-select"
              value={activeBoard?._id || ''}
              onChange={(e) => {
                const b = boards.find((brd) => brd._id === e.target.value);
                if (b) onSelectBoard(b);
              }}
            >
              {boards.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title}
                </option>
              ))}
            </select>
            <button
              className="btn-icon"
              title="Create Board"
              onClick={() => setShowBoardInput(!showBoardInput)}
            >
              ➕
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="navbar-right">
        {/* Real-Time Online Presence Indicator */}
        <div className="presence-pill" title={`${onlineUsers.length} user(s) currently active on this board`}>
          <span className="presence-dot animate-pulse"></span>
          <span className="presence-count">{onlineUsers.length} Online</span>
          <div className="presence-avatars">
            {onlineUsers.slice(0, 3).map((u, i) => (
              <span key={i} className="avatar-chip" title={u.name}>
                {u.name ? u.name.charAt(0).toUpperCase() : '?'}
              </span>
            ))}
          </div>
        </div>

        {/* Toggle Real-Time Chat Drawer */}
        <button
          className={`btn-chat-toggle ${isChatOpen ? 'active' : ''}`}
          onClick={onToggleChat}
          title="Toggle Team Chat"
        >
          💬 Chat
        </button>

        {/* User Info & Logout */}
        <div className="user-menu">
          <div className="user-avatar" title={user.email}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="user-name">{user.name}</span>
          <button className="btn-logout" onClick={onLogout} title="Sign Out">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Create Workspace Quick Modal / Bar */}
      {showWorkspaceInput && (
        <form onSubmit={handleCreateWorkspace} className="quick-add-bar animate-fade-in">
          <span>New Workspace:</span>
          <input
            type="text"
            placeholder="Workspace name..."
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary-sm">Create</button>
          <button type="button" className="btn-secondary-sm" onClick={() => setShowWorkspaceInput(false)}>Cancel</button>
        </form>
      )}

      {/* Create Board Quick Modal / Bar */}
      {showBoardInput && (
        <form onSubmit={handleCreateBoard} className="quick-add-bar animate-fade-in">
          <span>New Board:</span>
          <input
            type="text"
            placeholder="Board title..."
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary-sm">Create</button>
          <button type="button" className="btn-secondary-sm" onClick={() => setShowBoardInput(false)}>Cancel</button>
        </form>
      )}
    </header>
  );
}
