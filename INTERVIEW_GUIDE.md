# TaskPulse: Beginner Interview Guide

Use this guide to explain what the project actually does. Be honest about
unfinished areas: explaining a limitation clearly is better than claiming a
feature is production-ready when it is not.

## 1. A short project introduction

> "TaskPulse is a JavaScript full-stack task board and team chat demo. The
> frontend is React, the API is Express, MongoDB stores the data through
> Mongoose, and Socket.IO is used for live chat, typing indicators, presence,
> and card updates."

## 2. The request and data flow

```text
React UI
  ├── fetch() request ──> Express route ──> controller ──> Mongoose/MongoDB
  └── Socket.IO event <───────────────────────────────> Socket.IO handler
```

1. A user clicks or submits something in a React component.
2. For saved changes, the frontend calls a helper in `frontend/src/api/api.js`.
3. Express routes in `backend/src/routes/` call a controller.
4. A controller reads or writes a Mongoose model.
5. For selected changes, the server broadcasts a Socket.IO event to clients in
   the board room.

## 3. The data models

The app has five MongoDB collections:

1. **User** — name, email, hashed password, and avatar.
2. **Workspace** — name, owner, and an array of members with roles.
3. **Board** — title, workspace reference, and embedded lists.
4. **Card** — board and list IDs, title, description, position, priority,
   assignees, tags, due date, checklist, and attachments.
5. **Message** — board ID, sender ID, content, and timestamps.

The schema defines the shape of data. It does not by itself enforce all
permissions; the API must check who is allowed to access each document.

## 4. How authentication works

> "Passwords are hashed with bcryptjs before being stored. On login the server
> checks the hash and signs a JWT. The frontend stores the returned token in
> localStorage and sends it in the Authorization header. The `protect`
> middleware verifies that token for protected REST routes."

The server also sets an HTTP-only cookie, but the current frontend's API helper
uses the localStorage token in the Authorization header. There is no refresh
token flow.

## 5. How Socket.IO works in this project

Each board has a room named `board_<boardId>`. The frontend joins when it opens
a board and rejoins after the socket reconnects.

- **Chat:** `send_message` asks the server to save the message. The server
  broadcasts `new_message` after saving and acknowledges whether sending
  succeeded.
- **Typing:** `user_typing` tells other clients in that room that someone is
  typing.
- **Presence:** the server keeps an in-memory list of socket connections and
  broadcasts `presence_sync`. The visible list groups connections by user ID,
  so opening the same account in two tabs counts as one person.
- **Cards:** REST controllers broadcast card creation, update, deletion, and
  saved card moves to the board room.

Presence is temporary: it is stored in server memory and resets when the
backend restarts.

## 6. Questions you may be asked

### Why use both REST and Socket.IO?

> "REST is used to load data and save changes. Socket.IO tells other open
> clients about selected changes without making them refresh or poll
> repeatedly."

### Why are lists stored inside a board?

> "A board usually has a small number of lists, so this project embeds them in
> the board document. Cards are separate documents and refer to their board
> and list by ID."

Do not claim that the project has database indexes for every query; the current
schemas do not define those indexes.

### How do users collaborate?

> "The workspace model stores an owner and member entries. The interface can
> invite an existing registered user by email. For the demo accounts, I need
> to invite the other account to the workspace; they are not automatically
> added to the same workspace."

### Is this ready for production?

> "No. It is a learning/demo project. REST routes require a valid JWT, but
> membership and role checks are not consistently applied. Socket connections
> also need server-side authentication and board access checks before this
> should be exposed to untrusted users. It also needs automated backend tests
> and stronger input validation."

## 7. Good highlights to mention

- The code is separated into frontend components and backend routes,
  controllers, and models.
- Passwords are hashed rather than stored as plain text.
- MongoDB persists boards, cards, and chat messages.
- Socket.IO rooms limit normal broadcasts to clients that joined the same
  board room.
- Browser testing helped find issues with sender labels, duplicate presence,
  reconnection behavior, CORS, and duplicate card-move broadcasts.

Avoid claiming full role-based access control, socket authentication,
sub-millisecond delivery guarantees, full card reordering, or automated test
coverage. Those are not implemented comprehensively.
