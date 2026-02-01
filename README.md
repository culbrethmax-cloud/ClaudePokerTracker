# MaxVariance Poker Tracker

A personal poker session tracker for tracking cash games and tournaments across all devices.

## Features

- **Cash game tracking:** Input profit in BBs, auto-calculates dollar profit based on stakes
- **Tournament tracking:** Buy-in, cash-out, ROI calculation
- **Statistics:** BB/100, hourly rate, profit over time charts, results by stakes
- **Stat filtering:** Filter by stakes level, date range, or day of week
- **Import:** Paste data from Google Sheets to bulk import sessions
- **Cross-device sync:** Firebase real-time database syncs across all devices
- **Authentication:** Email/password or Google sign-in
- **Dark mode:** Claude-inspired dark theme

## Tech Stack

React, Vite, Tailwind CSS, Firebase (Auth, Firestore, Hosting), Recharts

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and fill in Firebase credentials
cp .env.example .env

# Start dev server
npm run dev

# Build and deploy
npm run build && firebase deploy --only hosting
```

See [SETUP.md](./SETUP.md) for detailed first-time setup instructions.
