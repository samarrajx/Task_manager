# 🔥 Personal Habit Tracker PWA

A zero-cost, serverless **Personal Habit Tracker** Progressive Web App (PWA) built with **Vite, React, TypeScript, and Vanilla CSS/Tailwind**, backed by **Google Sheets** and **Google Apps Script Web App API**, hosted for free on **GitHub Pages**.

---

## 🌟 Key Features

- **✅ Today Checklist**: Interactive daily task checklist with optimistic UI updates, priority tags, and goal progress bars.
- **📊 Dashboard**: Overview cards (today's completion %, streaks, weekly progress bar, missed today list, quick links) and an interactive monthly heatmap calendar with day details.
- **🔥 Streaks Tracking**: Active and personal best streaks with quiet milestone badges (7, 30, 100, and 365 days) and sortable desktop table view.
- **📈 Trends & Analytics**: Recharts visual graphs (weekday completion breakdown, best/worst day callouts, weekly line chart, and monthly bar chart).
- **📊 Numeric Statistics**: Pure stat cards displaying historical completion %, total completed vs missed habits, most-consistent habit, and most-skipped habit.
- **🏷️ Categories**: Category completion rate horizontal bar list with interactive category filtering integrated into the Today checklist.
- **🎯 Goals Management**: Active target goals with period progress tracking and inline progress bars next to relevant tasks.
- **⚠️ Missed Tasks**: Missed Today, Missed This Week (grouped by day), and Frequently Skipped (>30% miss rate) tasks with nav warning count badges.
- **📝 Journal & Notes**: Reflection form for daily mood, energy levels, wins, and challenges with a reverse-chronological history log.
- **📄 Reports & CSV Export**: Weekly and Monthly executive summaries with a browser-generated CSV export button.
- **⚙️ Settings & Data Backup**: Timezone configuration, day-cutoff hour (0–23), Google Tasks list sync toggles with a **"Refresh available lists"** button, and complete JSON **Data Backup & Restore** flow.
- **📱 PWA & Offline Support**: Installable on iOS/Android/Desktop, Service Worker caching, `localStorage` read-only offline viewing, and auto-resynchronization when reconnected.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 GitHub Pages (Frontend PWA)                 │
│         Vite + React + TypeScript + Service Worker          │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST / GET JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          Google Apps Script Web App (Backend API)           │
│        Executes as "Me" to access Google Tasks & Sheets     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Google Sheets (Database)                    │
│   Tabs: Config, DailyTasks, Streaks, Goals, Notes, Dashboard│
└─────────────────────────────────────────────────────────────┘
```

- **Database**: Google Sheets (Tabs: `Config`, `DailyTasks`, `Streaks`, `Goals`, `Notes`, `Dashboard`).
- **Backend**: Google Apps Script Web App API (`Code.gs`) executing as "Me" with Google Tasks API integration.
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS, hosted statically on GitHub Pages.

---

## 🚀 Quick Local Development Setup

### 1. Prerequisites
- Node.js v18+ and `npm`

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Local Credentials
Copy the local configuration template:
```bash
cp src/config.local.example.ts src/config.local.ts
```

Edit `src/config.local.ts` (which is gitignored) and add your Apps Script Web App URL and 32+ character Secret Token:
```typescript
export const LOCAL_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  SECRET_TOKEN: 'YOUR_32_CHAR_RANDOM_SECRET_TOKEN_HERE'
};
```

### 4. Start Development Server
```bash
npm run dev
```

---

## 📖 Full Deployment & Setup Guide

For step-by-step instructions on setting up your Google Spreadsheet, deploying the Google Apps Script backend API, and configuring automated GitHub Actions deployment to GitHub Pages, read the **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.
