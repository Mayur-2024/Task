import React from 'react';

export default function TaskCard({ card, onCardClick, onDragStart }) {
  // Calculate checklist progress
  const completedChecklists = card.checklists?.filter((c) => c.completed)?.length || 0;
  const totalChecklists = card.checklists?.length || 0;

  return (
    <div
      className="task-card glass-panel"
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onClick={() => onCardClick(card)}
    >
      {/* Priority Pill & Due Date */}
      <div className="card-top">
        <span className={`badge badge-${card.priority || 'medium'}`}>
          {card.priority || 'medium'}
        </span>
        {card.dueDate && (
          <span className="card-due-date">
            📅 {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="card-title">{card.title}</h4>

      {/* Description Snippet */}
      {card.description && (
        <p className="card-desc-snippet">{card.description}</p>
      )}

      {/* Card Footer: Checklist and Tags */}
      <div className="card-footer">
        {totalChecklists > 0 && (
          <span className="card-checklist-pill">
            ☑️ {completedChecklists}/{totalChecklists}
          </span>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="card-tags">
            {card.tags.slice(0, 2).map((t, idx) => (
              <span key={idx} className="tag-chip">
                🏷️ {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
