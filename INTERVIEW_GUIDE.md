# 🎯 TaskPulse — Interview Preparation & Architecture Guide

This guide is designed to help you **confidently explain the entire project in technical interviews**. The architecture has been refined to be **clean, modular, and beginner-friendly** while demonstrating full-stack engineering proficiency.

---

## ⚡ 1. The 30-Second Elevator Pitch

> *"TaskPulse is a real-time collaborative project management workspace built with the **MERN stack (MongoDB, Express, React, Node.js)** and **Socket.io**. It unites agile Kanban boards with live drag-and-drop card synchronization, instant team chat with MongoDB message persistence, and live member presence tracking so distributed teams can collaborate without refreshing the page."*

---

## 🏗️ 2. High-Level Architecture

```
                    ┌────────────────────────────────────────┐
                    │            Client (React)              │
                    └───────────────────┬────────────────────┘
                                        │
                    ┌───────────────────┴────────────────────┐
                    │                                        │
           (HTTP REST API)                             (WebSockets)
            • Auth & JWT                                • join_board / leave_board
            • CRUD for Workspaces/Boards                • card_moved / card_created
            • Message History                           • send_message / new_message
                    │                                   • presence_sync
                    ▼                                        ▼
    ┌───────────────────────────────────┐    ┌───────────────────────────────┐
    │     Express.js API Controllers     │    │   Socket.io Event Handlers    │
    └─────────────────┬─────────────────┘    └───────────────┬───────────────┘
                      │                                      │
                      └───────────────────┬──────────────────┘
                                          │ (Mongoose ODM)
                                          ▼
                         ┌─────────────────────────────────┐
                         │       MongoDB Database          │
                         │  • Users       • Workspaces     │
                         │  • Boards      • Cards          │
                         │  • Messages                     │
                         └─────────────────────────────────┘
```

---

## 🗂️ 3. How the Data Models Work (Easy to Draw on a Whiteboard)

You have 5 simple, logical collections in MongoDB:

1. **`User`** — `name`, `email`, `password` (hashed with `bcrypt`), `avatar`.
2. **`Workspace`** — Top-level organization container. Holds `name`, `ownerId`, and `members: [{ userId, role }]`.
3. **`Board`** — Belongs to a workspace (`workspaceId`). Contains an embedded array of `lists` (columns like *To Do*, *In Progress*, *Done*).
4. **`Card`** — Belongs to a board (`boardId`) and a list column (`listId`). Holds `title`, `description`, `position`, `priority`, `dueDate`, and `checklists`.
5. **`Message`** — Belongs to a board (`boardId`). Tracks `senderId`, `content`, and timestamps for the team chat.

---

## ⚡ 4. How Socket.io Works (The Most Impressive Part)

### Concept: Rooms
Instead of broadcasting every move to all users in the system, we use **Socket.io Rooms** keyed by `boardId`:
```javascript
socket.join(`board_${boardId}`);
```
Only users currently viewing that specific board receive updates for that board!

### The Real-Time Flow:
1. **Joining a Board (`join_board`)**:
   - The user opens a board ➔ socket emits `join_board` with `{ boardId, userId, user }`.
   - The server registers them in `boardUsers[boardId]` and broadcasts `presence_sync` so everyone sees who is online.
2. **Live Kanban Drag & Drop (`card_moved`)**:
   - User drags a card ➔ socket emits `card_moved` with `{ cardId, targetListId, newPosition, boardId }`.
   - Server broadcasts `card_moved` to all other peers in `board_${boardId}` so their UI updates instantly without reloading.
3. **Live Chat (`send_message`)**:
   - User sends a message ➔ server saves it to MongoDB using `Message.create()`.
   - Server populates sender details (`name`, `avatar`) and broadcasts `new_message` to the room.
4. **Typing Indicator (`user_typing`)**:
   - While typing, emits `{ boardId, user: { name }, isTyping: true }` to show "Alice is typing...".
5. **Graceful Disconnection (`disconnect`)**:
   - If a tab or network closes, the server automatically removes the socket from all boards and emits updated `presence_sync`.

---

## 💬 5. Top Interview Questions & How to Answer

### Q1: "Walk me through how Authentication is implemented."
> **Answer**:
> *"We use **JWT (JSON Web Tokens)** with password hashing via **bcryptjs**. 
> - When registering or logging in, the server hashes the password with a salt of 10, verifies the credentials, signs a JWT token containing `userId`, and sends it back in both an HTTP-only cookie and the JSON response.
> - Protected routes use an `auth.middleware.js` that checks for `req.headers.authorization` (Bearer token) or `req.cookies.token`, verifies the signature using `jwt.verify()`, and attaches the authenticated user document to `req.user`."*

### Q2: "How did you design your real-time synchronization?"
> **Answer**:
> *"We attached **Socket.io** directly to the HTTP server instance. When a client navigates to a board, they join a socket room named `board_<boardId>`. 
> - When a card is dragged or updated, the client emits `card_moved` or makes a REST call.
> - The server immediately broadcasts the change to peers in that specific room using `socket.to(room).emit()`. 
> - This keeps network traffic minimal since events are scoped strictly to the collaborators on that board."*

### Q3: "What happens if a user disconnects abruptly?"
> **Answer**:
> *"In our `socketHandler.js`, the `disconnect` event listens for unexpected socket drops. The server scans active rooms that the user was in, removes their socket from the in-memory `boardUsers` list, and immediately broadcasts a fresh `presence_sync` event so remaining team members see the updated online list in real time."*

### Q4: "Why did you use embedded lists in Board instead of a separate List collection?"
> **Answer**:
> *"Kanban lists (columns like 'To Do', 'In Progress', 'Done') are strictly 1-to-few per board (typically 3 to 6 columns). Embedding them directly inside the Board schema prevents expensive MongoDB `$lookup` joins, improves read performance when opening a board, and makes reordering lists simple and atomic within a single document update."*

### Q5: "How do your REST API and Socket.io communicate?"
> **Answer**:
> *"We attach the `io` instance to Express using `app.set('io', io)`. In controllers like `card.controller.js` and `message.controller.js`, after successfully writing a change to MongoDB, we retrieve `req.app.get('io')` and broadcast real-time events. This ensures that whether a client uses REST endpoints or WebSocket events, all collaborators stay in sync."*

---

## 🌟 6. Key Engineering Highlights to Mention

- **Separation of Concerns**: Clean MVC structure (`controllers/`, `routes/`, `models/`, `middlewares/`, `sockets/`).
- **Hybrid Communication**: Fast HTTP REST API for initial data loading + WebSockets for instant state propagation.
- **Data Integrity**: Cascade deletion ensures deleting a workspace or board cleanly removes orphaned boards, cards, and messages.
- **Developer Experience**: Modular architecture where each file is under 200 lines, fully self-explanatory, and simple to test.
