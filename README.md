# Health Tracker

A private daily health check-in for IBS, migraines, other health issues, daily habits and new things you try.

- Works offline once installed on your phone.
- Has no account and no cloud. All data is stored only on your phone.
- Includes backup and restore to a file, plus an optional PIN lock.

---

## One-time setup: put the app online (free, GitHub Pages)

You only do this once. It takes about 5 minutes on a computer, or in Chrome on your phone.

### Step 1. Make the repository public

GitHub Pages is free only for public repositories. Only the app's code becomes public. Your health data never leaves your phone.

1. Go to <https://github.com/mlbutzen-ui/health-tracker> and sign in.
2. Click **Settings** (the gear tab near the top of the repository page).
3. Scroll to the bottom, to the **Danger Zone** section.
4. Click **Change visibility**, then **Change to public**, and confirm.

### Step 2. Turn on GitHub Pages

1. Still in **Settings**, click **Pages** in the left menu. On a phone, the menu is under the ☰ button.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Under **Branch**, pick `claude/health-tracking-pwa-oohv80` and the folder `/ (root)`, then click **Save**.
4. Wait 1 to 2 minutes, then refresh the page. A box appears that says **"Your site is live at …"**.
   The address will be: **https://mlbutzen-ui.github.io/health-tracker/**

When the app gets new features, they are pushed to that same branch, and the website updates on its own.

### Step 3. Install it on your Android phone

1. Open **Chrome** on your phone and go to **https://mlbutzen-ui.github.io/health-tracker/**
2. Tap the **⋮** menu (top right).
3. Tap **Add to Home screen**, then choose **Install**. On some phones the menu item is called **Install app**.
4. The **Health** icon appears on your home screen. Open the app from that icon from now on.

The app works without internet after the first time it opens.

### Step 4. Recommended first steps in the app

1. Open **Settings → App lock** and tap **Set a PIN**.
2. After a few days of entries, tap **Settings → Save backup file**. Then keep a copy in Google Drive or email it to yourself.

---

## Important things to know

- **Back up regularly.** Data lives only in Chrome's storage on your phone. Some actions erase it, including uninstalling the app, clearing Chrome's site data for this site, or getting a new phone. The app reminds you on the check-in screen if it has been over a week since your last backup.
- **Restoring** a backup replaces everything in the app with the backup's contents.
- **Forgotten PIN:** a forgotten PIN can't be recovered. You would erase the app's data and restore your latest backup.
- **Updates:** when a new version is available, a banner says "A new version of the app is ready". Tap **Update**. Your entries are not affected.

---

## For whoever maintains the code

This is plain HTML, CSS and JavaScript, with no build step.

- `index.html` is the page shell.
- `js/app.js` holds all screens and logic.
- `js/defaults.js` holds the starting lists, scales and data shape.
- `js/db.js` stores data on the phone using IndexedDB.
- `sw.js` is the offline cache. **Bump `CACHE` whenever any file changes**, or phones keep the old version.
- `manifest.webmanifest` and `icons/` are the install metadata.

To run it locally, use `python3 -m http.server` and open <http://localhost:8000>.
