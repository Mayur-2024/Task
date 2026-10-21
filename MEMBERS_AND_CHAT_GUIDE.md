# Workspace Members and Board Chat

This guide describes the current member and chat implementation in TaskPulse.
It uses simple language and calls out important limitations.

## 1. Workspace members

A workspace stores its owner and a `members` array. Each member entry contains
a user ID, a role (`owner`, `admin`, or `member`), and a join date.

The member dialog can invite an **already registered** user by email. The
backend finds that user and adds their ID to the workspace. It does not send
an email invitation or create the account.

Relevant files:

- [workspace.model.js](./backend/src/models/workspace.model.js)
- [workspace.controller.js](./backend/src/controllers/workspace.controller.js)
- [workspace.routes.js](./backend/src/routes/workspace.routes.js)
- [MembersModal.jsx](./frontend/src/components/MembersModal.jsx)

### Important permission limitation

The workspace schema restricts role values to the listed choices, but that is
not the same as permission enforcement. Several controllers do not consistently
check whether the current user is the owner, an admin, or a member before
changing workspace data. Treat this as a learning project, not as a secure
multi-tenant service.

## 2. Board chat

Chat history is loaded through an authenticated REST endpoint. New messages
are normally sent over Socket.IO:

```text
Browser sends send_message
        ↓
Server checks the basic event payload and room membership
        ↓
MongoDB saves the message
        ↓
Server populates sender details and broadcasts new_message
        ↓
Server acknowledges success or failure to the sender
```

Messages are saved in MongoDB, so refreshing the page loads existing chat
history. The frontend merges history with messages that arrive live, using
message IDs to avoid duplicates.

The chat UI also shows typing indicators and uses the sender ID to show the
correct sender name and distinguish the current user's message.

## 3. Socket.IO rooms and presence

When the frontend selects a board, it asks Socket.IO to join a room named
`board_<boardId>`. Leaving a board removes the socket from the room. The client
also joins again after the socket reconnects.

Presence is stored in memory on the backend. The server groups multiple
connections for the same user ID into one visible active user. This handles
two tabs on one server, but presence:

- is cleared when the backend restarts;
- is not shared across multiple backend server processes; and
- depends on identity details sent by the client.

## 4. Current Socket events

| Event | Direction | What it does |
|---|---|---|
| `join_board` | Client → server | Joins a board room and updates presence. |
| `leave_board` | Client → server | Leaves a board room and updates presence. |
| `presence_sync` | Server → clients | Sends active user information for a board. |
| `send_message` | Client → server | Saves a message, then broadcasts it and acknowledges success/failure. |
| `new_message` | Server → clients | Delivers the saved message, including populated `senderId` details. |
| `user_typing` | Client → peers | Sends a typing status to other sockets in the room. |
| `card_moved` | Server → clients | Sent after a card move is saved through the REST API. |
| `card_created` | Server → clients | Sent after a card is created through the REST API. |
| `card_updated` | Server → clients | Sent after a card is updated through the REST API. |
| `card_deleted` | Server → clients | Sent after a card is deleted through the REST API. |

The server also has client event listeners for some card events. Those handlers
are not the normal authoritative save flow and should not be considered
permission checks.

## 5. Try it locally

1. Start MongoDB.
2. Start the backend from `backend` using `npm run dev`.
3. Start the frontend from `frontend` using `npm run dev`.
4. Open the frontend URL printed by Vite.
5. Log in with one demo account.
6. Log in as the other demo account in a private window or a separate browser.
7. Invite the other **registered** account from the workspace Members dialog.
8. Open the same workspace and board in both windows.
9. Open chat in both windows. Send a message and type in one window to check
   live chat and the typing indicator in the other.
10. Create or move a card and verify the other window updates.

The demo buttons use fixed email accounts. On a fresh database, each account
creates its own default workspace and board, so step 7 is needed before the
accounts share a workspace.

## 6. What still needs improvement

- Authenticate the Socket.IO handshake using a verified token.
- Read sender identity from the verified socket, not from a client event
  payload.
- Check workspace membership before joining a board room or loading/sending
  that board's messages.
- Apply owner/admin/member permissions consistently to REST endpoints.
- Consider a shared presence store if running more than one backend process.
- Add automated tests for chat persistence, send failures, permissions, and
  reconnect behavior.
