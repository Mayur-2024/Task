# ⚡ TaskPulse — Full-Stack Real-Time Workspace

> **TaskPulse** is a modern, full-stack collaborative workspace uniting agile Kanban project management with real-time team communication.

---

## 🎨 Visual Interface & Layout Wireframe

Here is the visual layout blueprint of the application interface:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚡ TaskPulse      [ 🏢 Engineering Team ▼ ]     🔍 Search tasks, boards...     🟢 4 Online   [ 👤 Alice ▼ ] │
├──────────────┬───────────────────────────────────────────────────────────────────┬──────────────────────────┤
│ WORKSPACES   │ 📋 Sprint 1 Board   [ ➕ Add List ]   [ 👥 Members ]   [ ⚙️ Filter ]│ 💬 Team Chat (Sprint 1)  │
│              ├─────────────────┬─────────────────┬─────────────────┬─────────────┤                          │
│ 📁 Eng Team  │ 📌 TO DO (3)    │ 🚀 IN PROG (2)  │ 🔍 REVIEW (1)   │ ✅ DONE (4) │ 🟢 Bob:                  │
│   • Sprint 1 │ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────┐ │ Hey team, moving auth    │
│   • Backlog  │ │ Fix Auth    │ │ │ Drag-n-Drop │ │ │ Socket Chat │ │ │ Setup DB│ │ bug to review now!       │
│   • Design   │ │ Bug         │ │ │ Pipeline    │ │ │ Perf Test   │ │ │ Schema  │ │ 10:42 AM                 │
│              │ │ 🏷️ Bug  ⚡P1│ │ │ 🏷️ Feature  │ │ │ 🏷️ QA   ⚡P2 │ │ │ 🏷️ Core │ │                          │
│ 📁 Marketing │ │ 👤 Alice    │ │ │ 👤 Bob, Dev │ │ │ 👤 Alice    │ │ │ 👤 Alice│ │ 🟣 Alice:                │
│   • Launch   │ └─────────────┘ │ └─────────────┘ │ └─────────────┘ │ └─────────┘ │ Awesome, reviewing now!  │
│              │ ┌─────────────┐ │ ┌─────────────┐ │                 │             │ 10:43 AM                 │
│ 📁 Design    │ │ Token Expiry│ │ │ Optimistic  │ │                 │             │                          │
│   • UI Kit   │ │ Refresh Flow│ │ │ State Roll  │ │                 │             │ ✍️ Bob is typing...      │
│              │ │ 🏷️ Auth     │ │ │ 🏷️ Client   │ │                 │             ├──────────────────────────┤
│ ──────────── │ └─────────────┘ │ └─────────────┘ │                 │             │ [ Type a message... ] 🚀 │
│ ⚙️ Settings  │ [ ➕ Add Card ] │ [ ➕ Add Card ] │ [ ➕ Add Card ] │ [➕ Add Card]│                          │
└──────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────┴──────────────────────────┘
```

### Card Detail Modal Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📌 Fix Authentication Token Refresh Bug                         [ ✕ Close ] │
├──────────────────────────────────────────┬──────────────────────────────────┤
│ 📝 Description                           │ ⚙️ Properties                    │
│ JWT refresh token cookie needs SameSite   │ Status:   [ In Progress ▼ ]      │
│ flag and automated silent rotation.      │ Priority: [ 🔴 High Priority ▼ ] │
│                                          │ Assignee: [ 👤 Alice Freeman ▼ ] │
│ ✅ Checklist (2/3)                       │ Due Date: [ 📅 Oct 15, 2026   ] │
│ [x] Reproduce 401 interceptor loop       │ Labels:   [ 🏷️ Auth ] [ 🏷️ Bug ]│
│ [x] Configure HttpOnly cookie options    │                                  │
│ [ ] Add unit test suite for token replay │ 👥 Activity & Discussion         │
│                                          │ • Alice added label "Auth"       │
│ 📎 Attachments (1)                       │ • Bob: "Checked on staging, LGTM"│
│ 📄 auth-flow-diagram.png                 │                                  │
└──────────────────────────────────────────┴──────────────────────────────────┘
```

---

## 🏗️ System Architecture & Data Flow

```
                                 ┌─────────────────────────────────┐
                                 │       React 18+ Client          │
                                 │  • Kanban Board (Drag-and-Drop) │
                                 │  • Real-Time Chat Drawer        │
                                 │  • Optimistic UI State Engine   │
                                 └───────────────┬─────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
          HTTP REST (Axios / Fetch)                         WebSockets (Socket.io Client)
          [Auth, CRUD, Workspaces]                          [cardMoved, chatMessage, typing]
                        │                                                 │
                        ▼                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Node.js / Express Backend                             │
│  ┌───────────────────────────┐                 ┌─────────────────────────────┐  │
│  │   REST Controllers & API  │                 │    Socket.io Server Hub     │  │
│  │  - Auth (JWT + Cookie)    │                 │  - Board Room Subscriptions │  │
│  │  - Workspace/Board RBAC   │                 │  - Live Broadcast Engine    │  │
│  │  - Card Reordering Engine │                 │  - User Presence & Typing   │  │
│  └─────────────┬─────────────┘                 └──────────────┬──────────────┘  │
└────────────────┼──────────────────────────────────────────────┼─────────────────┘
                 │                                              │
                 └──────────────────────┬───────────────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │      MongoDB Database       │
                         │   (Mongoose ODM Driver)     │
                         │  - Users     - Workspaces   │
                         │  - Boards    - Cards        │
                         │  - Messages                 │
                         └─────────────────────────────┘
```

---

## 🗄️ Database Schema & Index Specifications

| Collection | Key Fields | Indexes & Relationships |
| :--- | :--- | :--- |
| **`Users`** | `_id`, `name`, `email`, `passwordHash`, `avatar`, `createdAt` | Unique index on `email`. |
| **`Workspaces`** | `_id`, `name`, `ownerId`, `members: [{ userId, role }]`, `createdAt` | Index on `ownerId`, compound on `members.userId`. |
| **`Boards`** | `_id`, `title`, `workspaceId`, `lists: [{ _id, title, position }]`, `createdAt` | Compound index on `{ workspaceId: 1 }`. Embedded `lists` subdocuments. |
| **`Cards`** | `_id`, `title`, `description`, `boardId`, `listId`, `position`, `assignedTo: [userId]`, `priority`, `dueDate` | Compound index on `{ boardId: 1, listId: 1, position: 1 }` for instant ordered queries. |
| **`Messages`** | `_id`, `boardId`, `senderId`, `content`, `createdAt` | Compound index on `{ boardId: 1, createdAt: -1 }` for paginated chat history. |

---

## ⚡ Real-Time Socket Protocol Map

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_board` | Client ➔ Server | `{ boardId, userId }` | Subscribes socket to room `board_${boardId}`. |
| `leave_board` | Client ➔ Server | `{ boardId }` | Unsubscribes socket from board room. |
| `card_moved` | Client ➔ Server ➔ Broadcast | `{ cardId, sourceListId, targetListId, newPosition, boardId }` | Broadcasts real-time card move to all peers on the board. |
| `card_created` | Server ➔ Broadcast | `{ card }` | Broadcasts newly created card to room members. |
| `card_updated` | Server ➔ Broadcast | `{ card }` | Notifies peers of card edits (title, tags, assignees). |
| `send_message` | Client ➔ Server | `{ boardId, senderId, content }` | Writes message to MongoDB & broadcasts `new_message`. |
| `new_message` | Server ➔ Broadcast | `{ _id, boardId, sender: { name, avatar }, content, createdAt }` | Delivers instant chat message to board room. |
| `user_typing` | Client ➔ Server ➔ Broadcast | `{ boardId, user: { name } }` | Displays live typing indicator in the chat window. |
| `presence_sync` | Server ➔ Broadcast | `{ activeUsers: [] }` | Updates active online members list in board header. |

---

## 🗺️ Step-by-Step Implementation Roadmap

### 📍 Phase 1: Backend Foundation & Data Modeling
- [x] Initialize configuration & environment variables (`.env`, PORT, MONGO_URI, JWT secrets).
- [x] Implement Mongoose Schemas:
  - [x] `User` model with password hashing pre-save hooks (`bcrypt`).
  - [x] `Workspace` model with members array & role-based validation (`owner`, `admin`, `member`).
  - [x] `Board` model with embedded ordered `lists` schema.
  - [x] `Card` model with compound index `{ boardId: 1, listId: 1, position: 1 }`.
  - [x] `Message` model with pagination index `{ boardId: 1, createdAt: -1 }`.
- [x] Establish centralized MongoDB connection handler with retry logic.

### 📍 Phase 2: Security & Authentication Layer
- [ ] Setup JWT authentication with dual-token strategy:
  - [ ] Short-lived Access Token (15m) delivered in authorization payload.
  - [ ] Long-lived Refresh Token (7d) stored in secure `HttpOnly`, `SameSite=Strict` cookie.
- [ ] Implement Auth Controllers:
  - [ ] `POST /api/auth/register`
  - [ ] `POST /api/auth/login`
  - [ ] `POST /api/auth/refresh-token`
  - [ ] `POST /api/auth/logout`
  - [ ] `GET /api/auth/me`
- [ ] Create Authorization Middlewares:
  - [ ] `verifyToken`: Validates incoming JWT access token.
  - [ ] `verifyWorkspaceAccess`: Ensures user is a member of the requested workspace.
  - [ ] `verifyBoardAccess`: Validates board tenancy within workspace.

### 📍 Phase 3: REST API Controllers & Card Re-indexing
- [ ] **Workspace API**: Create, read, update, invite members, delete workspaces.
- [ ] **Board & List API**:
  - [ ] CRUD operations for boards.
  - [ ] CRUD operations for board lists (columns) with position re-ordering.
- [ ] **Card API with Reordering Pipeline**:
  - [ ] `POST /api/cards`: Create new card at tail position.
  - [ ] `PATCH /api/cards/:id/move`: Update column (`listId`) and positional index (`position`) with atomic bulk re-indexing of adjacent cards.
  - [ ] `PATCH /api/cards/:id`: Update card metadata (title, description, assignees, tags, due date).
  - [ ] `DELETE /api/cards/:id`: Remove card and shift succeeding positions.
- [x] **Chat API**: `GET /api/boards/:boardId/messages` (paginated chat history).

### 📍 Phase 4: Real-Time Engine (Socket.io Server)
- [x] Attach `Socket.io` server to the HTTP server instance with CORS configuration.
- [x] Implement Socket Authentication Middleware (validate user identity on handshake).
- [x] Implement Room Management:
  - [x] `join_board` / `leave_board` handlers.
  - [x] Dynamic presence tracking (online users per board).
- [x] Real-time Event Broadcasters:
  - [x] `card_moved`, `card_created`, `card_updated`, `card_deleted`.
  - [x] `send_message` with async database persistence and `new_message` broadcasting.
  - [x] `user_typing` (typing indicator) handlers.

### 📍 Phase 5: React Frontend & Drag-and-Drop State Engine
- [ ] Initialize React + Vite frontend application structure.
- [ ] Design System & Styling:
  - [ ] Modern dark mode palette with glassmorphic cards and glowing status pills.
  - [ ] Typography and responsive container layouts.
- [ ] State Management & Global Context:
  - [ ] `AuthContext`: Login state, token refresh interceptor, user session.
  - [ ] `WorkspaceContext`: Active workspace and board selections.
  - [ ] `BoardContext`: Active board state, column lists, and card collections.
  - [ ] `SocketContext`: Centralized WebSocket connection lifecycle and event listeners.
- [ ] Kanban Board UI & Drag-and-Drop:
  - [ ] Drag-and-drop interaction (between columns and within the same column).
  - [ ] **Optimistic UI Engine**: Cards move instantly in local React state with automatic rollback upon API failure.
- [ ] Task Card Modal: Edit title, markdown description, checklist, tag selector, member assigner.

### 📍 Phase 6: Live Team Chat Sidebar & Presence
- [ ] Collapsible real-time chat drawer docked to the board view.
- [ ] Message feed with timestamp formatting, sender avatars, and smooth auto-scroll.
- [ ] Active typing indicator ("Bob is typing...").
- [ ] Online presence bar displaying live avatars in the board header.

### 📍 Phase 7: Optimization, Hardening & Verification
- [ ] Rapid drag-and-drop concurrency stress testing.
- [ ] Socket reconnection and state re-synchronization on network drop.
- [ ] Input validation, error handling boundaries, and security headers (Helmet, CORS).

---

## 🚦 Project Folder Structure Blueprint

```
TaskPulse/
├── README.md                     # Roadmap, Architecture & Blueprint
├── backend/
│   ├── src/
│   │   ├── config/               # DB, JWT & Server configurations
│   │   ├── controllers/          # Auth, Workspace, Board, Card, Message controllers
│   │   ├── db/                   # MongoDB connection logic
│   │   ├── middlewares/          # Auth, RBAC & error handling middlewares
│   │   ├── models/               # User, Workspace, Board, Card, Message Mongoose models
│   │   ├── routes/               # Express REST route definitions
│   │   ├── sockets/              # Socket.io room handlers & event listeners
│   │   └── app.js                # Express app configuration
│   ├── server.js                 # HTTP + Socket.io Server entrypoint
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/                  # Axios HTTP client & API service layer
    │   ├── assets/               # Icons, styles, images
    │   ├── components/
    │   │   ├── auth/             # Login, Register forms
    │   │   ├── board/            # KanbanBoard, ColumnList, TaskCard, CardModal
    │   │   ├── chat/             # ChatSidebar, MessageItem, ChatInput, TypingIndicator
    │   │   ├── layout/           # Navbar, Sidebar, PresenceBar
    │   │   └── common/           # Modal, Button, Avatar, Badge, Dropdown
    │   ├── context/              # Auth, Board, Socket, Workspace React Contexts
    │   ├── hooks/                # Custom hooks (useDragAndDrop, useSocket, etc.)
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```
