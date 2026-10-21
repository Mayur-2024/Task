# Socket.IO in TaskPulse

This is a short guide to the Socket.IO handlers in `socketHandler.js`.

## The basic idea: rooms

When a client opens a board, it sends `join_board`. The server adds that
connection to a room named `board_<boardId>`. Events sent to that room reach
the connected clients that joined it.

```text
React client ── join_board ──> Socket.IO server
React client <── new_message ── Socket.IO server
```

The React socket lifecycle is managed in
[App.jsx](../../../frontend/src/App.jsx); the shared client is created in
[socket.js](../../../frontend/src/socket.js).

## Events implemented

| Event | Direction | Behavior |
|---|---|---|
| `join_board` | Client → server | Joins a room and updates online presence. |
| `leave_board` | Client → server | Leaves a room and updates online presence. |
| `presence_sync` | Server → clients | Reports unique user IDs currently connected to a board. |
| `send_message` | Client → server | Saves a chat message and responds using a Socket.IO acknowledgement. |
| `new_message` | Server → clients | Broadcasts the saved message with populated `senderId` details. |
| `user_typing` | Client → peers | Relays the typing state to other room members. |
| `card_moved` | Server → clients | Broadcast after the REST card-move action is saved. |
| `card_created` | Server → clients | Broadcast after a REST card create. |
| `card_updated` | Server → clients | Broadcast after a REST card update. |
| `card_deleted` | Server → clients | Broadcast after a REST card delete. |

The HTTP server and Socket.IO server are connected in `backend/server.js`.
Express controllers can access the Socket.IO instance using
`req.app.get('io')`.

## Chat acknowledgement example

The frontend sends a message with an acknowledgement callback:

```javascript
socket.timeout(5000).emit('send_message', payload, (timeoutError, result) => {
  if (timeoutError || !result?.ok) {
    // Keep the text and show an error.
  }
});
```

The server saves the message first. It broadcasts `new_message` after a
successful save and responds with `{ ok: true }`. If validation or saving
fails, it responds with `{ ok: false, message: '...' }`.

## Important security and reliability notes

- The socket connection is **not yet authenticated by the server**. Some event
  handlers accept user details from the client, so these details are not a
  trustworthy identity.
- Joining a board room is not yet protected by a workspace membership check.
- Presence is stored in a JavaScript object in this server process. It resets
  on restart and is not shared between multiple server instances.
- Socket.IO room membership limits who receives normal room broadcasts; it is
  not an authorization check.
- The frontend rejoins the active board after reconnecting, but this does not
  replace server-side authentication and membership checks.

Do not expose this real-time service to untrusted users until those checks are
implemented.
