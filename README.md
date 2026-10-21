# TaskPulse

TaskPulse is a beginner-friendly task board and team chat app. It is a
JavaScript full-stack project built with React, Express, MongoDB, and
Socket.IO.

This README describes what the code does today. Some parts are learning/demo
features and should not yet be treated as production-ready.

## What the app can do

- Register and log in with an email and password.
- Create a workspace and boards. A new account gets a default workspace and
  board when it has no existing data.
- Invite an existing account to a workspace by email.
- Create and delete board columns (lists).
- Create, edit, move, and delete task cards.
- Edit a card's title, description, priority, and checklist in the UI.
- Store card tags, due dates, assignees, and attachments in the data model;
  not all of these fields have complete UI workflows.
- Chat in a board room, load saved message history, and see typing indicators
  and online presence.
- Receive live card changes from REST actions made by other connected clients.

## How it is put together

```text
React browser app
  ├── REST requests ──> Express routes/controllers ──> MongoDB
  └── Socket.IO events <──────────────────────────────┘
                         Socket.IO server
```

- **React** renders the interface and keeps the currently selected workspace,
  board, cards, and messages in component state.
- **Express** provides JSON API endpoints.
- **Mongoose** defines MongoDB documents and connects to the database.
- **Socket.IO** handles board presence, typing indicators, chat delivery, and
  real-time card updates.

The main database collections are `users`, `workspaces`, `boards`, `cards`, and
`messages`. Lists are embedded inside a board document. A card refers to its
board and list by IDs.

## Run locally

Requirements:

- Node.js and npm
- MongoDB running locally, or a MongoDB connection string

Install dependencies (run once in each folder):

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

Create `backend/.env` with your own local settings:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskpulse
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Do not commit `.env` or share its secret values. The root `.gitignore` ignores
environment files; `backend/.env` is a local file and is not included as a
sample configuration.

Start the backend in one terminal:

```powershell
cd backend
npm run dev
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`. In development the
backend also accepts `http://127.0.0.1:5173`.

The backend health endpoint is `http://localhost:5000/api/health`.

## Main folders

```text
backend/
  server.js                 Starts Express, MongoDB, and Socket.IO
  src/
    app.js                  Express middleware and API routes
    config/                 Development CORS origin configuration
    controllers/            Request handlers and database actions
    db/                     MongoDB connection
    middlewares/            JWT authentication middleware
    models/                 Mongoose schemas
    routes/                 REST endpoint definitions
    sockets/                Socket.IO events and rooms

frontend/
  src/
    api/api.js              Fetch wrapper and REST helpers
    components/             React UI components
    App.jsx                 App state, REST actions, and socket lifecycle
    socket.js               Shared Socket.IO client
```

## Useful commands

```powershell
# Backend
cd backend
npm start
npm run dev

# Frontend
cd frontend
npm run dev
npm run lint
npm run build
```

There is currently no real backend test suite: `backend`'s `npm test` script is
a placeholder that exits with an error. The frontend build and lint commands
are available.

## Beginner notes and current limitations

- The demo login buttons use shared, fixed demo accounts. If the database is
  empty, each account creates its own default workspace; they are not
  automatically members of one another's workspace. Invite the other existing
  account to collaborate.
- The server verifies JWTs for REST routes, but workspace/board membership and
  roles are not consistently checked by every controller.
- Socket.IO currently trusts identity details supplied by the browser and does
  not authenticate each socket or verify board membership before joining. Use
  only with trusted local/demo data until that is fixed.
- Presence counts unique user IDs within one server process. It is in-memory,
  so it resets when the backend restarts and is not shared between multiple
  backend servers.
- Card updates through REST are broadcast after saving. Socket event handlers
  also accept some client-emitted card events; do not assume these events are
  secure or authoritative.
- The UI exposes fewer card fields than the database schema supports.
- Automated tests are limited. Always test changes manually and add automated
  tests before relying on the app for important work.

For more detail, see [Members and Chat](./MEMBERS_AND_CHAT_GUIDE.md),
[Interview Guide](./INTERVIEW_GUIDE.md), and
[Challenges Faced](./CHALLENGES_FACED.md).
