# 🛠️ Habit Tracker Setup & Deployment Guide

This guide walks you step-by-step through setting up your Google Sheets database, deploying the Google Apps Script backend API, configuring your local frontend environment, and deploying to **GitHub Pages**.

---

## Part 1: Google Apps Script Backend Setup

### 1. Create Google Spreadsheet & Open Apps Script
1. Create a new Google Spreadsheet in Google Drive (name it `Habit Tracker Database`).
2. In the Google Sheets menu, click **Extensions > Apps Script**.
3. Clear any default code in `Code.gs`.
4. Copy the entire contents of [`Code.gs`](./Code.gs) from this repository and paste it into the Apps Script editor.

### 2. Enable Google Tasks API Service
1. In the Apps Script left sidebar, click **Services (+)** next to Services.
2. Select **Google Tasks API** and click **Add**.

### 3. Initialize Sheet Tabs & Headers
1. In the Apps Script toolbar, select the function **`setupInitialSheet`** and click **Run**.
2. Grant authorization permissions when prompted.
3. Verify that the tabs `Config`, `DailyTasks`, `Streaks`, `Goals`, `Notes`, and `Dashboard` are created in your spreadsheet.

### 4. Configure Secret Token Authentication
1. Generate a strong random 32+ character secret token (e.g. using a password manager or `openssl rand -hex 16`).
2. In the Apps Script toolbar, select the function **`promptSetSecretToken`** and click **Run**.
3. Paste your generated secret token into the prompt dialog and click **OK**.

> [!IMPORTANT]
> Never use a simple default secret token. Store your 32+ character random secret token securely in your password manager.

### 5. Create Time-Driven 15-Minute Sync Trigger
1. In the Apps Script toolbar, select the function **`createTimeDrivenTrigger`** and click **Run**.
2. This creates an automatic background trigger that syncs Google Tasks every 15 minutes.

### 6. Deploy Apps Script as a Web App API
1. In the top right corner of Apps Script, click **Deploy > New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and choose **Web app**.
3. Configure the deployment settings **EXACTLY** as follows:
   - **Description**: `Habit Tracker API v3`
   - **Execute as**: **Me (your email)**
   - **Who has access**: **Anyone**
4. Click **Deploy**.
5. Copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).

---

## Part 2: Frontend & GitHub Pages Deployment

### 1. Configure Local Developer Credentials
1. In your local repository root, copy the template:
   ```bash
   cp src/config.local.example.ts src/config.local.ts
   ```
2. Open `src/config.local.ts` and paste your deployment URL and secret token:
   ```typescript
   export const LOCAL_CONFIG = {
     WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
     SECRET_TOKEN: 'your-32-character-random-secret-token'
   };
   ```

### 2. Configure GitHub Actions Workflow
Create `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. Enable GitHub Pages in Repository Settings
1. Go to your GitHub repository on [github.com](https://github.com).
2. Click **Settings > Pages** in the repository navigation.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Push your changes to `main`. GitHub Actions will automatically build Vite production assets and deploy your PWA to:

👉 **`https://<your-username>.github.io/<repo-name>/`**
