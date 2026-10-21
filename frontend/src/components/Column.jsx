import React, { useState } from 'react';
import TaskCard from './TaskCard';

export default function Column({
  list,
  cards,
  onCardClick,
  onAddCard,
  onDeleteList,
  onDragStart,
  onDropCard,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || submitting) return;

    setSubmitting(true);
    setNewTitle('');
    setIsAdding(false);

    try {
      await onAddCard(list._id, trimmedTitle, priority);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDropCard(list._id);
  };

  return (
    <div
      className={`kanban-column glass-panel ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="column-header">
        <div className="column-title-wrap">
          <h3 className="column-title">{list.title}</h3>
          <span className="column-count">{cards.length}</span>
        </div>
        <button
          className="btn-icon-subtle"
          title="Delete Column"
          onClick={() => {
            if (window.confirm(`Delete list "${list.title}" and its cards?`)) {
              onDeleteList(list._id);
            }
          }}
        >
          ✕
        </button>
      </div>

      {/* Cards Scroll Container */}
      <div className="column-cards">
        {cards.map((card) => (
          <TaskCard
            key={card._id}
            card={card}
            onCardClick={onCardClick}
            onDragStart={onDragStart}
          />
        ))}

        {cards.length === 0 && !isAdding && (
          <div className="empty-column-hint">Drag cards here</div>
        )}
      </div>

      {/* Quick Add Card Form */}
      {isAdding ? (
        <form onSubmit={handleCreate} className="add-card-form animate-fade-in">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
            required
          />
          <div className="add-card-actions">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="priority-select"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🔵 Medium</option>
              <option value="high">🟡 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
            <div className="form-buttons">
              <button type="submit" className="btn-primary-sm">Add</button>
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={() => setIsAdding(false)}
              >
                ✕
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button className="btn-add-card" onClick={() => setIsAdding(true)}>
          ➕ Add Card
        </button>
      )}
    </div>
  );
}
