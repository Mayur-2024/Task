# TaskPulse Frontend

This folder contains the React user interface, built and served with Vite.
The app communicates with the backend using REST requests and Socket.IO.

## Run it

Start MongoDB and the backend first. Then from this folder:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Commands

```powershell
npm run dev
npm run lint
npm run build
npm run preview
```

The default backend URLs are `http://localhost:5000/api` for REST and
`http://localhost:5000` for Socket.IO. You can override them using Vite
environment variables:

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Use a local `.env` file for these values if needed; do not put secrets in
frontend environment variables because frontend variables are visible in the
browser.

## Where to look

- `src/App.jsx` — current user, workspace/board selection, API actions, and
  Socket.IO event handlers.
- `src/api/api.js` — REST request helper and endpoint shortcuts.
- `src/socket.js` — shared Socket.IO client.
- `src/components/` — login, navigation, board, cards, members, and chat UI.

The frontend lint command currently reports warnings about React state changes
inside effects and one unused catch variable in `AuthModal.jsx`. There is no
configured frontend automated test script yet.
