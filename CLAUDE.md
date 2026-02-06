# MaxVariance Poker Tracker

## Project Overview

A personal poker session tracker web app (PWA) for tracking cash games and tournaments across devices. Built for a small group of users, hosted on Firebase.

**Live site:** Hosted on Firebase Hosting (custom domain: maxvariance.net)

**Primary branch:** `main` — all development and deployments should use this branch.

## Tech Stack

- **Frontend:** React 18 + Vite (JavaScript, not TypeScript)
- **Styling:** Tailwind CSS with a dark mode theme (grey backgrounds, white text)
- **Database:** Firebase Firestore (real-time sync)
- **Auth:** Firebase Authentication (email/password + Google sign-in)
- **Hosting:** Firebase Hosting (free tier)
- **Charts:** Recharts
- **API Server:** Express.js (Node.js) — read-only API for external tools

## Project Structure

```
src/                            # Frontend React app
├── App.jsx                    # Routes, ProtectedRoute/PublicRoute wrappers
├── main.jsx                   # Entry point, renders App
├── index.css                  # Base dark mode styles, Tailwind directives
├── firebase/
│   └── config.js              # Firebase init, exports db/auth/googleProvider
├── hooks/
│   ├── useAuth.jsx            # Auth context: Google sign-in, email/password, reset
│   └── useSessions.jsx        # Firestore CRUD for sessions (real-time listener)
├── components/
│   ├── Layout.jsx             # App shell: header, bottom nav bar
│   ├── Charts.jsx             # ProfitChart, StakesChart, BBPer100Chart (Recharts)
│   ├── SessionForm.jsx        # Form for adding/editing sessions (cash + tournament)
│   └── StatCard.jsx           # Reusable stat display card
├── pages/
│   ├── Login.jsx              # Email/password + Google sign-in, password reset
│   ├── Dashboard.jsx          # Overview with recent sessions and quick stats
│   ├── AddSession.jsx         # Add new session page (uses SessionForm)
│   ├── Sessions.jsx           # Session list with filters and delete
│   ├── Stats.jsx              # Statistics with filters (stakes, date range, day of week)
│   └── ImportSessions.jsx     # CSV/TSV import from Google Sheets
└── utils/
    └── calculations.js        # All math: BB/100, hourly rate, ROI, profit calcs

api/                            # Read-only API server (Express.js)
├── index.js                   # Express app entry point
├── package.json               # Separate dependencies from frontend
├── ecosystem.config.cjs       # pm2 config for Mac Mini deployment
├── .env.example               # Environment variable template
├── middleware/
│   ├── auth.js                # Bearer token validation
│   └── rateLimit.js           # 60 req/min limiter
├── routes/
│   └── stats.js               # All endpoint handlers
├── utils/
│   ├── cache.js               # 5-minute in-memory TTL cache
│   ├── calculations.js        # Ported poker math + duration buckets, trends
│   └── firestore.js           # Firebase Admin SDK init, session fetching
└── scripts/
    └── backup.js              # Firestore data export script
```

## Firestore Data Model

```
users/
  {userId}/
    sessions/
      {sessionId}/
        type: "cash" | "tournament"
        date: "YYYY-MM-DD"
        gameType: "NLHE" | "PLO" | "MTT" | etc.
        duration: number (minutes)
        createdAt: ISO string

        # Cash game fields:
        hands: number
        stakes: "NL50" | "NL100" | etc.
        profitBB: number
        profitDollars: number (auto-calculated from profitBB + stakes)
        location: string
        notes: string

        # Tournament fields:
        buyIn: number
        cashOut: number
        location: string
        notes: string
```

**Security rules:** Users can only read/write their own data (`request.auth.uid == userId`).

## Authentication

Two methods available (both use Firebase Auth):
- **Email/password:** Sign up, sign in, password reset via email
- **Google sign-in:** OAuth popup flow

Auth state is managed via React Context in `useAuth.jsx`. All routes except `/login` are wrapped in `ProtectedRoute`.

## Styling Conventions

The app uses a **dark mode theme** similar to Claude's UI:
- Background: `#2D2D2D` / `bg-[#2D2D2D]`
- Cards: `bg-gray-800` (use `.card` class from index.css)
- Text primary: `text-gray-100`
- Text secondary: `text-gray-400`
- Inputs: `bg-gray-700 border-gray-600 text-gray-100` (use `.input` class)
- Profit text: `text-green-400` / `.profit-text`
- Loss text: `text-red-400` / `.loss-text`
- Active buttons: `bg-primary-600 text-white`
- Inactive buttons: `bg-gray-700 text-gray-300`
- Chart tooltips: `backgroundColor: '#374151'`, `color: '#e5e7eb'`
- Chart grid: `stroke="#4b5563"`

**Important:** All new UI must follow the dark theme. Do not use light mode colors like `bg-white`, `bg-gray-50`, `text-gray-800`, etc.

## Key Calculations (utils/calculations.js)

- **Stakes parsing:** `NL50` = $0.50 BB, `NL100` = $1.00 BB, etc.
- **Dollar profit:** `profitBB * bbValue` (auto-calculated on save)
- **BB/100:** `(totalBB / totalHands) * 100`
- **Hourly rate:** `(totalProfit / totalMinutes) * 60`
- **ROI:** `((cashOuts - buyIns) / buyIns) * 100`

## Stats Filtering

The Stats page (`Stats.jsx`) has filters that apply to all stats/charts:
- **Stakes filter:** Buttons for each stake level found in sessions
- **Date range:** Start/end date pickers
- **Day of week:** Toggle buttons (Sun-Sat)
- Filters use `useMemo` to derive `filteredSessions` from raw sessions

## Import Feature

`ImportSessions.jsx` supports importing from Google Sheets:
- Auto-detects tab (Google Sheets copy/paste) vs comma (CSV file) delimiter
- Expected columns: Date, GameType, LengthHours, Hands, Stakes, ResultBB, ResultCash
- Detects tournaments via `GameType` containing "MTT"
- Date format must be YYYY-MM-DD

## Build & Deploy

```bash
# Local development
npm run dev

# Build and deploy to Firebase Hosting
npm run build && firebase deploy --only hosting
```

### Deployment Prerequisites

1. **Firebase CLI:** `sudo npm install -g firebase-tools`
2. **Firebase login:** `firebase login`
3. **Firebase project set:** `firebase use <project-id>` (creates `.firebaserc`)
4. **`.env` file:** Must exist with Firebase credentials (not committed to git). Copy from `.env.example` and fill in values from Firebase Console → Project Settings → Your apps.

### Deployment Files

- `firebase.json` — Hosting config (public directory: `dist`, SPA rewrites). Committed to repo.
- `.firebaserc` — Maps to Firebase project ID. Created locally by `firebase use`. Not committed.
- `.env` — Firebase API keys and project config. Not committed (in `.gitignore`).

### First-Time Deploy on a New Machine

```bash
sudo npm install -g firebase-tools
firebase login
firebase use <your-project-id>
cp .env.example .env   # Then fill in your Firebase credentials
npm install
npm run build && firebase deploy --only hosting
```

### Routine Deploy After Code Changes

```bash
npm run build && firebase deploy --only hosting
```

## Read-Only API Server

A separate Express.js server providing read-only access to session data. Used by an AI poker coaching assistant (Clawd) running in Docker on the Mac Mini.

### Running the API Server

```bash
cd api
npm install
npm start          # or: node index.js
npm run dev        # with auto-reload (node --watch)
```

### Persistent Running (Mac Mini)

```bash
npm install -g pm2
cd api
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup        # follow printed instructions for auto-start on boot
```

### API Environment Variables

Create `api/.env` (copy from `api/.env.example`):

```
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
FIREBASE_USER_ID=your_firebase_uid
API_KEY=your_generated_api_key
PORT=3001
NODE_ENV=production
```

- Generate API key: `openssl rand -hex 32`
- Service account key: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### Authentication

All endpoints except `/api/health` require bearer token auth:
```
Authorization: Bearer YOUR_API_KEY
```

Rate limit: 60 requests per minute per IP.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status (no auth required) |
| GET | `/api/sessions` | Paginated sessions with notes (query: from, to, type, stakes, limit, offset) |
| GET | `/api/stats/summary` | Aggregate stats: profit, BB/100, hourly rate, win rate |
| GET | `/api/stats/by-duration` | Sessions bucketed by duration |
| GET | `/api/stats/by-game-type` | Breakdown by cash/tournament and stakes |
| GET | `/api/stats/by-day` | Results by day of week |
| GET | `/api/stats/trends` | Rolling averages of BB/100 and profit |
| POST | `/api/cache/clear` | Force 5-minute cache refresh |

### Backup Script

```bash
cd api
npm run backup
```

Exports all sessions to `api/backups/sessions-backup-TIMESTAMP.json`.

### Notes

- Completely isolated from frontend (separate package.json, own node_modules)
- Uses Firebase Admin SDK (server-side) — independent from client-side Firebase SDK
- 5-minute cache reduces Firestore reads
- Location field included in responses; notes only in `/api/sessions`

## Common Tasks

**Add a new page:**
1. Create component in `src/pages/`
2. Add route in `App.jsx` wrapped in `ProtectedRoute` + `Layout`
3. Add nav item in `Layout.jsx` navItems array

**Add a new stat:**
1. Add calculation function in `utils/calculations.js`
2. Use it in `Stats.jsx` (make sure to use `filteredSessions`)

**Modify session data model:**
1. Update `SessionForm.jsx` for input
2. Update `useSessions.jsx` if new calculated fields needed
3. Update `calculations.js` if new stats derived from it
