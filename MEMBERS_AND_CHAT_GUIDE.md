# 👥 Team Members Management & Real-Time Chat Guide

This document provides a complete, beginner-friendly guide to how **Team Member Management** and **Real-Time Chat** are architected, implemented, and tested in **TaskPulse**.

---

## 📑 Table of Contents
1. [Team Members Management](#1-team-members-management)
   - [Architectural Decision: Why Workspace-Level?](#architectural-decision-why-workspace-level)
   - [Database Schema](#database-schema)
   - [The Invitation & Removal Flow](#the-invitation--removal-flow)
   - [Roles & Permissions](#roles--permissions)
2. [Real-Time Team Chat (Socket.io)](#2-real-time-team-chat-socketio)
   - [Socket.io Room Strategy](#socketio-room-strategy)
   - [Message Flow & Database Persistence](#message-flow--database-persistence)
   - [Live Typing Indicator & Auto-Scroll](#live-typing-indicator--auto-scroll)
   - [Socket Events Protocol Table](#socket-events-protocol-table)
3. [🧪 How to Test Both Features (2-Window Demo)](#3-how-to-test-both-features-2-window-demo)
4. [🎯 Interview Talking Points & Ready Answers](#4-interview-talking-points--ready-answers)

---

## 1. Team Members Management

### Architectural Decision: Why Workspace-Level?
In agile tools like Trello, Slack, and Jira:
- A **Workspace** represents the organization or team (e.g., *"Engineering Team"*).
- A **Board** represents a specific project or sprint (e.g., *"Sprint 1"*).

> **Design Choice**: Members are invited at the **Workspace level**. Once a user is added to a Workspace, they automatically gain access to collaborate across all project boards within that workspace without needing repeated invitations.

---

### Database Schema
In [`workspace.model.js`](file:///c:/Users/admin/Desktop/projects/New/backend/src/models/workspace.model.js), members are stored as an embedded array:

```javascript
const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});
```

---

### The Invitation & Removal Flow

```
User enters email ➔ Frontend api.addMember() ➔ POST /api/workspaces/:id/members
                                                        │
                      ┌─────────────────────────────────┴─────────────────────────────────┐
                      ▼                                                                   ▼
             User.findOne({ email })                                       Check if already in workspace
             (Returns 404 if not found)                                    (Returns 400 if already added)
                      │
                      ▼
             Push to workspace.members ➔ Save in MongoDB ➔ Return populated members list
```

1. **Invite by Email**: An admin/owner types `bob@taskpulse.com` and selects a role.
2. **Backend Validation**:
   - Confirms user exists in `User` collection.
   - Prevents duplicate invitations.
   - Pushes `{ userId, role }` and saves to MongoDB.
3. **Populated Response**: Returns populated user details (`name`, `email`, `avatar`) so the UI displays them immediately.
4. **Member Removal**: The workspace owner can remove members with `DELETE /api/workspaces/:id/members/:memberId`.

---

### Roles & Permissions
| Role | Capabilities |
| :--- | :--- |
| **`owner`** | Full control: delete workspace, invite members, change roles, remove members. |
| **`admin`** | Can invite new members and create/delete project boards. |
| **`member`** | Standard access: view boards, create/drag cards, chat in real-time. |

---

## 2. Real-Time Team Chat (Socket.io)

### Socket.io Room Strategy
Instead of broadcasting chat messages to the entire platform, we isolate communication using **Rooms**:
```javascript
// Each board gets its own isolated room
const roomName = `board_${boardId}`;
socket.join(roomName);
```
Only members currently viewing that board receive its chat messages and typing notifications.

---

### Message Flow & Database Persistence

```
1. User types message & hits Send
         │
         ▼
2. socket.emit('send_message', { boardId, senderId, content })
         │
         ▼
3. Backend socketHandler.js:
   • Creates Message document in MongoDB: Message.create({ boardId, senderId, content })
   • Populates sender details (name, avatar, email)
   • Broadcasts to room: io.to(`board_${boardId}`).emit('new_message', populatedMessage)
         │
         ▼
4. All connected peers in that room receive 'new_message' and update their feed instantly!
```

---

### Live Typing Indicator & Auto-Scroll
- **Typing Indicator**: When a user types into the chat box, `user_typing` is emitted with `{ user: { name }, isTyping: true }`. A 1.5-second debounce automatically resets the indicator when typing stops.
- **Auto-Scroll**: A React `useRef` automatically scrolls the chat feed to the bottom whenever a new message arrives.

---

### Socket Events Protocol Table

| Event Name | Direction | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `join_board` | Client ➔ Server | `{ boardId, userId, user: { name } }` | Subscribes socket to board room & triggers presence sync. |
| `leave_board` | Client ➔ Server | `{ boardId }` | Leaves board room and recalculates active members. |
| `presence_sync` | Server ➔ Clients | `{ boardId, activeUsers: [...] }` | Broadcasts list of active online users on the board. |
| `send_message` | Client ➔ Server | `{ boardId, senderId, content }` | Saves chat to MongoDB & triggers room broadcast. |
| `new_message` | Server ➔ Clients | `{ _id, boardId, sender, content, createdAt }` | Delivers incoming message to everyone in the room. |
| `user_typing` | Client ➔ Server ➔ Peers | `{ boardId, user: { name }, isTyping }` | Shows/hides "Alice is typing..." indicator. |

---

## 3. 🧪 How to Test Both Features (2-Window Demo)

Follow this 1-minute walkthrough to verify both features live:

### Step 1: Start the Servers
- **Terminal 1**: `cd backend && npm start` (Running on port 5000)
- **Terminal 2**: `cd frontend && npm run dev` (Running on port 5173/5174)

### Step 2: Open Window 1 (Alice)
1. Open browser at `http://localhost:5173/`.
2. Click **"👤 Alice (Tech Lead)"** to log in.
3. Click **"👥 Members"** in the top navigation bar.
4. Type `bob@taskpulse.com`, choose `Member`, and click **Invite**.
   - *Result*: Bob is now registered as a team member of Alice's workspace!

### Step 3: Open Window 2 (Bob in Incognito Mode)
1. Open a new **Incognito / Private Window**.
2. Go to the same URL and click **"👤 Bob (Developer)"** to log in.
3. Bob is automatically placed in Alice's workspace and board!

### Step 4: Test Real-Time Collaboration
- Look at the top bar: **🟢 2 Online** appears with both avatars.
- Open the **💬 Chat** drawer in both windows:
  - Type in Alice's window ➔ watch **"✍️ Alice Freeman is typing..."** appear in Bob's window.
  - Send message ➔ delivers instantly to Bob and saves to MongoDB.
- Drag a card in Bob's window ➔ moves live on Alice's screen in 0ms!

---

## 4. 🎯 Interview Talking Points & Ready Answers

### Question 1: *"How do you handle team permissions and member access?"*
> **Answer**:
> *"We implemented a workspace-centric tenancy model. Workspaces maintain an embedded array of members containing `userId` references and their associated roles (`owner`, `admin`, `member`). When validating access, we verify that the requesting user's ID matches either the workspace owner or is present in the members array, preventing unauthorized cross-workspace data access."*

---

### Question 2: *"Why did you use WebSockets for chat instead of HTTP polling?"*
> **Answer**:
> *"HTTP polling requires repeated requests at fixed intervals, wasting bandwidth and introducing artificial latency. By using **Socket.io WebSockets**, we establish a single persistent bi-directional connection. Messages and typing indicators are delivered with **sub-millisecond latency**, and by using **Socket.io Rooms** (`board_${boardId}`), messages are scoped strictly to users active on that board."*

---

### Question 3: *"How do you prevent lost chat messages if a user refreshes or disconnects?"*
> **Answer**:
> *"We pair WebSockets with MongoDB persistence. When a `send_message` event is received, the server creates a `Message` document in MongoDB before broadcasting `new_message` to the room. When a user initially joins a board, we load the historical message feed via our REST endpoint (`GET /api/messages/:boardId`), ensuring complete chat continuity."*
