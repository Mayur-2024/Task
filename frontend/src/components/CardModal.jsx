import React, { useState } from 'react';

export default function CardModal({ card, onClose, onUpdateCard, onDeleteCard }) {
  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [checklists, setChecklists] = useState(card.checklists || []);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toggle checklist item
  const handleToggleChecklist = (index) => {
    const updated = [...checklists];
    updated[index].completed = !updated[index].completed;
    setChecklists(updated);
  };

  // Add new checklist item
  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    setChecklists([...checklists, { title: newChecklistText.trim(), completed: false }]);
    setNewChecklistText('');
  };

  // Remove checklist item
  const handleRemoveChecklist = (index) => {
    setChecklists(checklists.filter((_, idx) => idx !== index));
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateCard(card._id, {
      title,
      description,
      priority,
      checklists,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <input
            className="modal-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
          />
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Priority selector */}
          <div className="modal-section">
            <label className="modal-label">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="modal-select"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🔵 Medium</option>
              <option value="high">🟡 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {/* Description */}
          <div className="modal-section">
            <label className="modal-label">Description</label>
            <textarea
              className="modal-textarea"
              rows={4}
              placeholder="Add detailed task notes or requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Checklists */}
          <div className="modal-section">
            <label className="modal-label">Checklist ({checklists.filter(c => c.completed).length}/{checklists.length})</label>
            <div className="checklist-list">
              {checklists.map((item, index) => (
                <div key={index} className="checklist-item">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleChecklist(index)}
                  />
                  <span className={item.completed ? 'completed-text' : ''}>{item.title}</span>
                  <button
                    type="button"
                    className="btn-remove-check"
                    onClick={() => handleRemoveChecklist(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklist} className="add-check-form">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
              />
              <button type="submit" className="btn-secondary-sm">Add</button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="btn-danger-sm"
            onClick={() => {
              if (window.confirm('Delete this card?')) {
                onDeleteCard(card._id);
                onClose();
              }
            }}
          >
            🗑️ Delete Card
          </button>

          <div className="modal-actions-right">
            <button className="btn-secondary-sm" onClick={onClose}>Cancel</button>
            <button className="btn-primary-sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
