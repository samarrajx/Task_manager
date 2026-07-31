/**
 * Habit Tracker Configuration & API Credentials
 * 
 * SECURITY NOTE:
 * Do NOT commit live Google Apps Script deployment URLs or secret tokens to git.
 * 
 * To set your local credentials:
 * 1. Copy `src/config.local.example.ts` to `src/config.local.ts` (which is gitignored).
 * 2. Export `LOCAL_CONFIG` with your deployment URL and 32+ character secret token:
 * 
 *    export const LOCAL_CONFIG = {
 *      WEB_APP_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
 *      SECRET_TOKEN: 'your-32-character-random-secret-token'
 *    };
 */

let localConfig: { WEB_APP_URL?: string; SECRET_TOKEN?: string } = {};

try {
  const modules = import.meta.glob<{ LOCAL_CONFIG?: { WEB_APP_URL?: string; SECRET_TOKEN?: string } }>(
    './config.local.ts',
    { eager: true }
  );
  const localModule = modules['./config.local.ts'];
  if (localModule && localModule.LOCAL_CONFIG) {
    localConfig = localModule.LOCAL_CONFIG;
  }
} catch (e) {
  // config.local.ts is optional
}

export const API_CONFIG = {
  WEB_APP_URL:
    localConfig.WEB_APP_URL ||
    (import.meta.env.VITE_WEB_APP_URL as string) ||
    'YOUR_WEB_APP_URL_HERE',
  SECRET_TOKEN:
    localConfig.SECRET_TOKEN ||
    (import.meta.env.VITE_SECRET_TOKEN as string) ||
    'YOUR_SECRET_TOKEN_HERE'
};
