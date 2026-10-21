# Challenges Faced While Building TaskPulse

TaskPulse connects a React browser app, an Express API, MongoDB, and Socket.IO.
The main learning challenge was keeping all four parts in agreement while
still keeping the code approachable.

## 1. Showing changes in other browser windows

**Challenge:** When someone creates, edits, or moves a task, other people on
the board should see the saved change.

**What we learned:** Updating the screen and broadcasting an event before
confirming the database save can make clients disagree. Card moves were also
being broadcast from both the client and the API.

**What changed:** Card moves now go through the REST API. The API saves the
move and broadcasts one update after saving. The browser test confirmed that
another open tab displayed the move.

## 2. Understanding repeated joins and presence counts

**Challenge:** Terminal logs showed repeated board joins, and opening one
account in two tabs could make presence count the same person twice.

**What changed:** The React socket effect now tracks the board ID rather than
the entire board object. The server tracks joined boards using a `Set` and
groups active connections by user ID before sending presence updates.

Presence is still stored only in memory on one backend process, so it is reset
when that process restarts.

## 3. Rejoining after a disconnect

**Challenge:** A socket can reconnect to the server without automatically
rejoining a board room.

**What changed:** The frontend now joins its active board on the Socket.IO
`connect` event. Restarting the backend during browser testing showed the
clients reconnecting and presence returning.

## 4. Displaying the right chat sender

**Challenge:** Messages could display “Collaborator” or the wrong “You” label.

**Cause and fix:** The database response uses populated `senderId` data, while
the UI was looking for a `sender` property. The chat UI now reads `senderId`
and compares IDs in a way that supports both `_id` and `id`.

## 5. Showing message-send failures

**Challenge:** A message could fail validation after the input was cleared.

**What changed:** The server now acknowledges whether a message was saved. The
frontend waits for that response, keeps the text after a failure, and shows an
error. A too-long message was tested in the browser and remained in the input
with an error message.

## 6. Loading history while live messages arrive

**Challenge:** Chat history and new Socket.IO messages can arrive at nearly
the same time.

**What changed:** The frontend merges messages by ID and ignores an older board
load response after the user has changed boards.

## 7. Localhost CORS differences

**Challenge:** Browsers treat `localhost` and `127.0.0.1` as different
origins, even when both refer to the local machine.

**What changed:** In development the backend allows both local frontend
origins. The backend origin configuration was checked with requests from both
addresses.

## 8. Keeping development output understandable

**Challenge:** Mongoose warned that the `new: true` option was deprecated on
some update calls.

**What changed:** Affected workspace, board, and card updates now use
`returnDocument: 'after'` and enable update validation.

## How the fixes were checked

- Frontend production build completed successfully.
- Frontend lint completed with warnings.
- Backend JavaScript syntax checks passed.
- Browser checks covered local login, duplicate-tab presence, chat sender
  labels, chat send failures, reconnecting, and card updates across two tabs.

These were manual browser checks, not a complete automated test suite. The
backend test command remains a placeholder.

## Still important to improve

Socket connections and board room joins do not yet have complete
server-side authentication and membership checks. Some event payloads also
include identity details supplied by the browser. This project should only be
used with trusted local/demo data until socket and API authorization are
implemented consistently.
