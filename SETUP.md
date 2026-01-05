# Poker Tracker Setup Guide

This guide will walk you through setting up your personal Poker Tracker. It takes about 5-10 minutes.

## Prerequisites

- A Google account (you already have this!)
- Node.js installed on your computer (for local development)

## Step 1: Create a Firebase Project (Free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project")
3. Enter a project name: `poker-tracker` (or anything you like)
4. You can disable Google Analytics (not needed) - click Continue
5. Wait for the project to be created, then click **Continue**

## Step 2: Enable Authentication

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click on **"Google"** under "Additional providers"
4. Toggle the **Enable** switch to ON
5. Select your email as the Project support email
6. Click **Save**

## Step 3: Create Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in production mode"** and click Next
4. Choose a location closest to you (e.g., `us-central` for US, `europe-west` for Europe)
5. Click **Enable**

## Step 4: Set Up Security Rules

1. In Firestore Database, click the **"Rules"** tab
2. Replace the existing rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

## Step 5: Register Your Web App

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Enter an app nickname: `poker-tracker-web`
5. You do NOT need to set up Firebase Hosting (leave unchecked)
6. Click **Register app**
7. You'll see a code block with `firebaseConfig` - **keep this page open!**

## Step 6: Configure Your App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in the values from Firebase (from Step 5):
   ```
   VITE_FIREBASE_API_KEY=AIzaSy...your-key...
   VITE_FIREBASE_AUTH_DOMAIN=poker-tracker-xxxxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=poker-tracker-xxxxx
   VITE_FIREBASE_STORAGE_BUCKET=poker-tracker-xxxxx.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## Step 7: Run the App Locally

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173`

## Step 8: Access from Your Phone

While running locally, your phone can access the app if both devices are on the same WiFi:

1. Find your computer's local IP address:
   - Mac: System Preferences > Network > Your IP is shown
   - Windows: Open CMD, type `ipconfig`, look for IPv4 Address

2. On your phone, open a browser and go to: `http://YOUR_IP:5173`

**For a better mobile experience**, you can deploy to Firebase Hosting (free):

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

This gives you a permanent URL like `https://poker-tracker-xxxxx.web.app` that works on all devices!

## Adding to Your iPhone Home Screen

1. Open the app URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Poker Tracker" and tap Add

Now it works like a native app!

## Troubleshooting

### "Sign-in popup was blocked"
- Allow popups for the site in your browser settings

### "Permission denied" errors
- Make sure you completed Step 4 (Security Rules)
- Make sure you're signed in with Google

### Can't access from phone
- Make sure both devices are on the same WiFi network
- Check your firewall settings
- Try deploying to Firebase Hosting instead

## Optional: Deploy to Firebase Hosting (Recommended)

For the best experience across all devices, deploy to Firebase Hosting:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize hosting:
   ```bash
   firebase init hosting
   ```
   - Select your project
   - Set `dist` as your public directory
   - Configure as single-page app: **Yes**
   - Don't overwrite `index.html`

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

5. Your app is now live at: `https://YOUR-PROJECT-ID.web.app`

This URL works on all your devices - iPhone, PC, MacBook - with data syncing automatically!

---

## Cost

**Firebase Spark Plan (Free)** includes:
- 1 GB Firestore storage
- 50,000 document reads/day
- 20,000 document writes/day
- 10 GB/month hosting bandwidth

For personal poker tracking, you'll use less than 1% of these limits. **It's free!**
