import React, { useState, useEffect, useRef } from 'react';

export default function ChatDrawer({
  isOpen,
  onClose,
  boardTitle,
  messages,
  onSendMessage,
  onTyping,
  typingUser,
  currentUser,
}) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Notify peers that user started typing
    onTyping(true);

    // Clear previous timeout and set new one to stop typing after 1.5 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || isSending) return;

    setSendError('');
    setIsSending(true);
    try {
      await onSendMessage(content);
      setInputText('');
    } catch (error) {
      setSendError(error.message || 'Message could not be sent.');
    } finally {
      setIsSending(false);
      onTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="chat-drawer glass-panel animate-fade-in">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-icon">💬</span>
          <h3 className="chat-title">{boardTitle ? `Chat: ${boardTitle}` : 'Team Chat'}</h3>
        </div>
        <button className="btn-close" onClick={onClose} title="Close Chat">
          ✕
        </button>
      </div>

      {/* Message Feed */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat-hint">
            <p>No messages yet.</p>
            <span>Be the first to say hi to the team!</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const sender =
              msg.senderId && typeof msg.senderId === 'object' ? msg.senderId : msg.sender;
            const senderId = sender?._id || msg.senderId || msg.sender?._id;
            const currentUserId = currentUser?._id || currentUser?.id;
            const isMe =
              senderId &&
              currentUserId &&
              String(senderId) === String(currentUserId);
            const senderName = sender?.name || (isMe ? currentUser.name : 'Collaborator');
            const initial = senderName.charAt(0).toUpperCase();
            const timeStr = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div key={msg._id || index} className={`chat-message ${isMe ? 'message-self' : ''}`}>
                <div className="msg-avatar">{initial}</div>
                <div className="msg-bubble">
                  <div className="msg-meta">
                    <span className="msg-sender">{isMe ? 'You' : senderName}</span>
                    <span className="msg-time">{timeStr}</span>
                  </div>
                  <div className="msg-text">{msg.content}</div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Typing Indicator */}
        {typingUser && (
          <div className="typing-indicator animate-pulse">
            <span>✍️ {typingUser} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
          className="chat-input"
          autoFocus
        />
        <button type="submit" className="btn-send-chat" disabled={!inputText.trim() || isSending}>
          🚀
        </button>
      </form>
      {sendError && <div className="auth-error" role="alert">{sendError}</div>}
    </aside>
  );
}
