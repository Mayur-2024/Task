# ⚡ Socket.io Beginner Guide for TaskPulse

This guide explains how **Socket.io** is used in TaskPulse in a simple and beginner-friendly way.

---

## 💡 How It Works

1. The client (React app) connects to the server via WebSocket.
2. When opening a board, the client joins a room named `board_<boardId>`.
3. Any actions (moving a card, sending a chat message, typing) are emitted to that room so everyone on the board sees the updates in real time!

---

## 📋 Socket Events Summary

| Event Name | Who Sends It | What It Does |
| :--- | :--- | :--- |
| `join_board` | Client ➔ Server | Joins a board room and tells everyone you are online |
| `leave_board` | Client ➔ Server | Leaves the board room and updates online presence |
| `presence_sync` | Server ➔ Client | Sends the list of currently online users |
| `card_moved` | Client ➔ Others | Broadcasts a moved card to everyone on the board |
| `card_created` | Client ➔ Others | Broadcasts a newly created card |
| `card_updated` | Client ➔ Others | Broadcasts card changes (title, checklist, etc.) |
| `card_deleted` | Client ➔ Others | Broadcasts card deletion |
| `send_message` | Client ➔ Server | Saves a message in MongoDB & broadcasts `new_message` |
| `new_message` | Server ➔ Everyone | Delivers new chat message with sender info |
| `user_typing` | Client ➔ Others | Shows/hides "user is typing..." indicator |

---

## 🚀 Easy Frontend Example (React / JavaScript)

```javascript
import { io } from 'socket.io-client';

// 1. Connect to backend server
const socket = io('http://localhost:5000');

// 2. Join a board room
socket.emit('join_board', {
  boardId: '65f1234567890',
  userId: 'user123',
  user: { name: 'Alice' }
});

// 3. Receive active online users
socket.on('presence_sync', ({ activeUsers }) => {
  console.log('Online users:', activeUsers);
});

// 4. Send a chat message
function handleSendMessage(text) {
  socket.emit('send_message', {
    boardId: '65f1234567890',
    senderId: 'user123',
    content: text
  });
}

// 5. Receive incoming messages
socket.on('new_message', (message) => {
  console.log('New message received:', message);
});

// 6. Broadcast card move
function handleCardMove(cardId, sourceListId, targetListId, newPosition) {
  socket.emit('card_moved', {
    boardId: '65f1234567890',
    cardId,
    sourceListId,
    targetListId,
    newPosition
  });
}

// 7. Receive card move from another user
socket.on('card_moved', (data) => {
  console.log('Another user moved card:', data);
});
```
