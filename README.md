# MineGuard AI Safety Dashboard

React + Vite frontend with a Node.js + Express backend.

## Project structure

- `public/mine-background.png` — realistic underground mine background
- `src/` — React frontend
- `server/` — Node.js/Express API

## 1. Frontend

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## 2. Backend

Open a second terminal:

```bash
cd server
npm install
npm run dev
```

Backend: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

The Vite development server proxies `/api` to the Node backend.

## 3. Production

Build the frontend:

```bash
npm run build
```

For a hosted frontend, set `VITE_API_URL` to the deployed backend URL including `/api`.

GitHub Pages can host the built frontend, but it does not run a Node/Express server. Deploy `server/` to a Node-compatible host and put its URL into `VITE_API_URL`.

## API endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/sensors`
- `GET /api/alerts`
- `GET /api/mines`

The current backend uses demo/in-memory data. The next phase can replace `server/src/data.js` with real sensor/ML/database integrations.
