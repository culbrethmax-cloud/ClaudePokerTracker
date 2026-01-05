# Poker Tracker Setup Guide

Follow these steps exactly. Total time: 10-15 minutes.

---

## PART 1: Install Node.js (Skip if already installed)

### Check if you have Node.js:
1. Open **Terminal** (Mac) or **Command Prompt** (Windows)
   - Mac: Press `Cmd + Space`, type "Terminal", press Enter
   - Windows: Press `Windows key`, type "cmd", press Enter
2. Type this and press Enter:
   ```
   node --version
   ```
3. If you see a version number (like `v18.17.0`), skip to PART 2
4. If you see an error, continue below to install Node.js

### Install Node.js:
1. Open your web browser
2. Go to: https://nodejs.org
3. Click the big green button that says **"LTS"** (this downloads the installer)
4. Open the downloaded file
5. Click **Next** through all the screens (use default settings)
6. Click **Install**
7. Click **Finish**
8. **Close and reopen** Terminal/Command Prompt
9. Type `node --version` to confirm it works

---

## PART 2: Set Up Firebase (Free Database)

### Step 2.1: Create a Firebase Account/Project

1. Open your web browser
2. Go to: https://console.firebase.google.com
3. Sign in with your Google account (the one you want to use for the app)
4. Click the **"Create a project"** button (or "Add project" if you've used Firebase before)
5. In the "Enter your project name" box, type: `poker-tracker`
6. Click **Continue**
7. You'll see "Enable Google Analytics for this project"
   - Turn the toggle **OFF** (you don't need this)
8. Click **Create project**
9. Wait about 30 seconds for it to set up
10. When you see "Your new project is ready", click **Continue**

### Step 2.2: Turn On Google Sign-In

1. Look at the left sidebar
2. Click **"Build"** to expand the menu (if not already expanded)
3. Click **"Authentication"**
4. Click the **"Get started"** button in the middle of the screen
5. You'll see a list of sign-in methods
6. Click on **"Google"** (in the "Additional providers" section)
7. Click the toggle switch at the top right to turn it **ON** (it will turn blue)
8. Click the dropdown under "Project support email"
9. Select your email address
10. Click the blue **"Save"** button

### Step 2.3: Create the Database

1. Look at the left sidebar again
2. Click **"Firestore Database"**
3. Click the **"Create database"** button
4. You'll see "Secure rules for Cloud Firestore"
   - Select **"Start in production mode"**
   - Click **Next**
5. Choose your location:
   - If you're in the US: select `nam5 (us-central)`
   - If you're in Europe: select `eur3 (europe-west)`
   - If you're elsewhere: pick the closest one
6. Click **Enable**
7. Wait about 30 seconds for it to create

### Step 2.4: Set Up Security Rules

1. You should now see your database (it's empty, that's okay)
2. Click the **"Rules"** tab at the top (next to "Data")
3. You'll see some code. **Select all of it** and delete it
4. Copy this entire block and paste it in:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Click the **"Publish"** button
6. If asked to confirm, click **"Publish"** again

### Step 2.5: Get Your Firebase Settings

1. Look at the left sidebar
2. Click the **gear icon** (⚙️) next to "Project Overview"
3. Click **"Project settings"**
4. Scroll down until you see **"Your apps"** section
5. Click the **</>** icon (this is the web icon)
6. In the "App nickname" box, type: `poker-tracker-web`
7. Leave "Firebase Hosting" unchecked
8. Click **"Register app"**
9. You'll see a code block. Look for the part that says `firebaseConfig`
10. **Keep this page open** - you'll need these values in the next step!

It looks something like this:
```
const firebaseConfig = {
  apiKey: "AIzaSyB1234567890abcdefg",
  authDomain: "poker-tracker-12345.firebaseapp.com",
  projectId: "poker-tracker-12345",
  storageBucket: "poker-tracker-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

---

## PART 3: Configure Your App

### Step 3.1: Open the Project Folder

1. Open **Terminal** (Mac) or **Command Prompt** (Windows)
2. Navigate to your poker tracker folder by typing:
   ```
   cd /home/user/ClaudePokerTracker
   ```
   (Adjust this path if you put the project somewhere else)

### Step 3.2: Create Your Settings File

**On Mac:**
1. In Terminal, type this and press Enter:
   ```
   cp .env.example .env
   ```

**On Windows:**
1. In Command Prompt, type this and press Enter:
   ```
   copy .env.example .env
   ```

### Step 3.3: Edit Your Settings File

1. Open the `.env` file in any text editor:
   - **Mac**: In Terminal, type: `open -e .env`
   - **Windows**: In Command Prompt, type: `notepad .env`
   - Or find the file in your file browser and double-click it

2. You'll see this:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. Go back to the Firebase page you kept open (from Step 2.5)

4. Replace each value with your values from Firebase. For example, if your Firebase config shows:
   ```
   apiKey: "AIzaSyB1234567890abcdefg",
   ```
   Then change this line:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   ```
   To this:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyB1234567890abcdefg
   ```

5. Do this for ALL 6 values:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

6. **Save the file** (Cmd+S on Mac, Ctrl+S on Windows)
7. Close the text editor

---

## PART 4: Run the App

### Step 4.1: Install Dependencies (First Time Only)

1. In Terminal/Command Prompt, make sure you're in the project folder
2. Type this and press Enter:
   ```
   npm install
   ```
3. Wait for it to finish (might take 1-2 minutes)
4. You'll see some text scroll by. When it's done, you'll see your cursor again

### Step 4.2: Start the App

1. Type this and press Enter:
   ```
   npm run dev
   ```
2. Wait a few seconds. You'll see something like:
   ```
   VITE v5.0.0  ready in 500 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.50:5173/
   ```
3. **Write down the Network address** (like `http://192.168.1.50:5173/`) - you'll need this for your phone!

### Step 4.3: Open in Your Browser

1. Open your web browser (Chrome, Safari, Firefox, etc.)
2. Go to: `http://localhost:5173`
3. You should see the Poker Tracker login page!
4. Click **"Continue with Google"**
5. Sign in with your Google account
6. You're in! 🎉

---

## PART 5: Access from Your iPhone

**Important:** Your computer must be running the app (from Step 4.2) for this to work.

1. Make sure your iPhone is on the **same WiFi network** as your computer
2. Open **Safari** on your iPhone
3. Type the **Network address** from Step 4.2 (like `http://192.168.1.50:5173`)
4. The app should load!
5. Tap **"Continue with Google"** and sign in

### Add to Your Home Screen (So It Feels Like a Real App):

1. With the app open in Safari, tap the **Share button** (square with an arrow pointing up)
2. Scroll down and tap **"Add to Home Screen"**
3. Name it **"Poker"** or **"Poker Tracker"**
4. Tap **"Add"**

Now you have an app icon on your home screen!

---

## How to Use Daily

### Starting the App:

**On your computer:**
1. Open Terminal/Command Prompt
2. Go to the project folder:
   ```
   cd /home/user/ClaudePokerTracker
   ```
3. Start the app:
   ```
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser

**On your iPhone:**
- Make sure your computer is running the app
- Open the Poker Tracker from your home screen (or go to the Network address in Safari)

### Stopping the App:
- In Terminal/Command Prompt, press `Ctrl + C`

---

## Troubleshooting

### "This site can't be reached" on iPhone
- Make sure your computer is running `npm run dev`
- Make sure your iPhone is on the same WiFi as your computer
- Try the address again (make sure you typed it correctly)

### "Sign-in popup was blocked"
- Your browser blocked the Google sign-in popup
- Look for a popup blocker icon in your browser's address bar and allow popups

### "Permission denied" or "Missing permissions" errors
- Go back to Step 2.4 and make sure you set up the security rules correctly
- Make sure you clicked "Publish" after pasting the rules

### The Network address changed
- This can happen if your computer gets a new IP address
- Just check the Terminal output when you run `npm run dev` for the new address

---

## Cost

**This is 100% free.** Firebase's free tier includes way more than you'll ever need for personal use.
