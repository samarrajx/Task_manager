# Habit Tracker Setup Guide & Web App Deployment

This guide walks you through configuring secret token authentication and deploying your Google Apps Script as a Web App API.

---

## 1. Update your Apps Script Code
Copy the full content from **[Code.gs](file:///c:/Users/Samar%20Raj/Desktop/tasks%20tracker/Code.gs)** into your Apps Script editor.

---

## 2. Set Your Secret Token
1. In the Apps Script toolbar, select the function **`promptSetSecretToken`** and click **Run**.
2. Enter your desired secret token (or keep the default: `my-habit-secret-123`).
3. Click **OK**. This stores your token securely in Apps Script **Script Properties**.

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

## Web App Deployment URL
`https://script.google.com/macros/s/AKfycbzuCJa72RoSdQNm6QcLnqQ5CrP2ySH2vKygLHGxmZc1CGNQGC2lKol0p_SoWIwwE6vW/exec`
