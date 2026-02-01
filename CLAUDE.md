# MaxVariance Poker Tracker

## Project Overview

A personal poker session tracker web app (PWA) for tracking cash games and tournaments across devices. Built for a small group of users, hosted on Firebase.

**Live site:** Hosted on Firebase Hosting (custom domain: maxvariance.net)

## Tech Stack

- **Frontend:** React 18 + Vite (JavaScript, not TypeScript)
- **Styling:** Tailwind CSS with a dark mode theme (grey backgrounds, white text)
- **Database:** Firebase Firestore (real-time sync)
- **Auth:** Firebase Authentication (email/password + Google sign-in)
- **Hosting:** Firebase Hosting (free tier)
- **Charts:** Recharts

## Project Structure

```
src/
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
