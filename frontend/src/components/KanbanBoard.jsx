import React, { useState } from 'react';
import Column from './Column';

export default function KanbanBoard({
  board,
  cards,
  onCardClick,
  onAddCard,
  onMoveCard,
  onAddList,
  onDeleteList,
}) {
  const [draggedCard, setDraggedCard] = useState(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');

  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.setData('text/plain', card._id);
  };

  const handleDropCard = (targetListId) => {
    if (!draggedCard) return;

    // Only move if target column is different or reordered
    if (draggedCard.listId !== targetListId) {
      onMoveCard(draggedCard._id, targetListId);
    }
    setDraggedCard(null);
  };

  const handleAddColumnSubmit = (e) => {
    e.preventDefault();
    if (!columnTitle.trim()) return;
    onAddList(columnTitle.trim());
    setColumnTitle('');
    setShowAddColumn(false);
  };

  if (!board) {
    return (
      <div className="empty-board-state">
        <h2>No Board Selected</h2>
        <p>Select or create a board from the navigation bar above.</p>
      </div>
    );
  }

  const lists = board.lists || [];

  return (
    <div className="kanban-container">
      {/* Kanban Board Columns Container */}
      <div className="kanban-board">
        {lists.map((list) => {
          const listCards = cards.filter((c) => c.listId === list._id);
          return (
            <Column
              key={list._id}
              list={list}
              cards={listCards}
              onCardClick={onCardClick}
              onAddCard={onAddCard}
              onDeleteList={onDeleteList}
              onDragStart={handleDragStart}
              onDropCard={handleDropCard}
            />
          );
        })}

        {/* Add Column Button / Form */}
        <div className="add-column-wrapper">
          {showAddColumn ? (
            <form onSubmit={handleAddColumnSubmit} className="add-column-form glass-panel animate-fade-in">
              <input
                type="text"
                placeholder="Column title (e.g. QA, Backlog)..."
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                autoFocus
                required
              />
              <div className="form-buttons">
                <button type="submit" className="btn-primary-sm">Add Column</button>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => setShowAddColumn(false)}
                >
                  ✕
                </button>
              </div>
            </form>
          ) : (
            <button
              className="btn-add-column glass-panel"
              onClick={() => setShowAddColumn(true)}
            >
              ➕ Add Column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
