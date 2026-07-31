/**
 * Habit Tracker Configuration & API Credentials
 * 
 * SECURITY NOTE:
 * Do NOT commit live Google Apps Script deployment URLs or secret tokens to git.
 * 
 * Credentials Resolution Priority:
 * 1. User custom input saved in localStorage (`ht_custom_url` / `ht_custom_token`).
 * 2. `src/config.local.ts` (gitignored local file for dev).
 * 3. Environment variables (`VITE_WEB_APP_URL` / `VITE_SECRET_TOKEN` set in CI secrets).
 * 4. Placeholder fallback.
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

export const getApiConfig = () => {
  let customUrl = '';
  let customToken = '';
  try {
    customUrl = localStorage.getItem('ht_custom_url') || '';
    customToken = localStorage.getItem('ht_custom_token') || '';
  } catch (e) {}

  const url =
    customUrl.trim() ||
    localConfig.WEB_APP_URL ||
    (import.meta.env.VITE_WEB_APP_URL as string) ||
    'YOUR_WEB_APP_URL_HERE';

  const token =
    customToken.trim() ||
    localConfig.SECRET_TOKEN ||
    (import.meta.env.VITE_SECRET_TOKEN as string) ||
    'YOUR_SECRET_TOKEN_HERE';

  const isUnconfigured = !url || url.includes('YOUR_WEB_APP_URL_HERE');

  return {
    WEB_APP_URL: url,
    SECRET_TOKEN: token,
    isUnconfigured
  };
};

export const API_CONFIG = getApiConfig();
