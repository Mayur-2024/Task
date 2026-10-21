import React, { useState } from 'react';
import { api } from '../api/api';

export default function MembersModal({
  workspace,
  currentUser,
  onClose,
  onWorkspaceUpdated,
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const members = workspace.members || [];
  const isOwner =
    workspace.ownerId?._id === currentUser._id ||
    workspace.ownerId === currentUser._id ||
    workspace.ownerId?.toString() === currentUser._id?.toString();

  // Handle adding member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.addMember(workspace._id, {
        email: email.trim(),
        role,
      });

      setSuccess(`User "${email}" added successfully!`);
      setEmail('');
      if (res.workspace) {
        onWorkspaceUpdated(res.workspace);
      }
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // Handle removing member
  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const res = await api.removeMember(workspace._id, memberUserId);
      if (res.workspace) {
        onWorkspaceUpdated(res.workspace);
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="members-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">👥 Team Members</h3>
            <p className="modal-subtitle">{workspace.name}</p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleAddMember} className="invite-form">
          <label className="modal-label">Invite by Registered Email</label>
          <div className="invite-inputs">
            <input
              type="email"
              placeholder="e.g. bob@taskpulse.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="role-select">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? 'Adding...' : 'Invite'}
            </button>
          </div>
          {error && <div className="invite-error">{error}</div>}
          {success && <div className="invite-success">{success}</div>}
        </form>

        {/* Members List */}
        <div className="members-list-section">
          <label className="modal-label">Current Members ({members.length})</label>
          <div className="members-list">
            {members.map((m, index) => {
              const memberUser = m.userId || {};
              const memberId = memberUser._id ? memberUser._id.toString() : memberUser.toString();
              const name = memberUser.name || 'User';
              const memberEmail = memberUser.email || '';
              const initial = name.charAt(0).toUpperCase();
              const isSelf = memberId === currentUser._id?.toString();

              return (
                <div key={index} className="member-item">
                  <div className="member-left">
                    <div className="member-avatar">{initial}</div>
                    <div className="member-details">
                      <span className="member-name">
                        {name} {isSelf && <span className="self-tag">(You)</span>}
                      </span>
                      {memberEmail && <span className="member-email">{memberEmail}</span>}
                    </div>
                  </div>

                  <div className="member-right">
                    <span className={`badge badge-role badge-${m.role}`}>
                      {m.role}
                    </span>

                    {/* Only show remove button if owner, and not self */}
                    {isOwner && !isSelf && (
                      <button
                        className="btn-remove-member"
                        title="Remove Member"
                        onClick={() => handleRemoveMember(memberId)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="quick-invite-hint">
            💡 <span>Tip: Register or use <b>bob@taskpulse.com</b> to test team collaboration.</span>
          </div>
          <button className="btn-secondary-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
