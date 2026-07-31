# Habit Tracker Setup Guide & Web App Deployment

This guide walks you through configuring secret token authentication, deploying your Google Apps Script as a Web App API, and configuring your local frontend environment.

---

## 1. Update Apps Script Code
Copy the full content from `Code.gs` in the root of this repository into your Google Apps Script editor.

---

## 2. Set Your Secret Token
1. Generate a strong random secret token (32+ characters recommended, e.g. using a password manager or `openssl rand -hex 16`).
2. In the Apps Script toolbar, select the function **`promptSetSecretToken`** and click **Run**.
3. Paste your generated 32+ character secret token into the prompt dialog.
4. Click **OK**. This stores your token securely in Apps Script **Script Properties**.

> [!IMPORTANT]
> Do NOT use simple or default fallback tokens. Always set a unique 32+ character secret token.

---

## 3. Deploy as a Web App
1. In the top right corner of the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon (**Select type**) next to "Select type" and select **Web app**.
3. Configure the deployment settings **EXACTLY** as follows:
   - **Description**: `Habit Tracker API v3`
   - **Execute as**: **Me (your email)**
   - **Who has access**: **Anyone**
4. Click **Deploy**.
5. Grant permissions if prompted.
6. Copy the **Web App URL** generated.

---

## 4. Local Frontend Configuration
1. Copy `src/config.local.example.ts` to `src/config.local.ts` (which is gitignored to keep your secrets private):
   ```bash
   cp src/config.local.example.ts src/config.local.ts
   ```
2. Open `src/config.local.ts` and set your credentials:
   ```typescript
   export const LOCAL_CONFIG = {
     WEB_APP_URL: 'YOUR_DEPLOYMENT_URL_HERE',
     SECRET_TOKEN: 'YOUR_32_CHAR_RANDOM_SECRET_TOKEN_HERE'
   };
   ```

---

## Web App Deployment URL Placeholder
`YOUR_DEPLOYMENT_URL_HERE`
