import { getApiConfig } from '../config';
import type {
  TaskItem,
  StreakItem,
  GoalItem,
  NoteItem,
  DashboardMetrics,
  StatisticsData,
  TrendsData,
  CategoryData,
  MissedData,
  SettingsData
} from '../types';

/**
 * Enhanced fetchApi with offline caching & safe unconfigured fallback.
 * Saves last-fetched Dashboard, Today, Streaks, Statistics, Trends, etc. to localStorage.
 * When offline or unconfigured, falls back to cached data cleanly.
 */
async function fetchApi<T>(action: string, method: 'GET' | 'POST' = 'GET', extraData: Record<string, any> = {}): Promise<T> {
  const config = getApiConfig();
  const token = config.SECRET_TOKEN;
  const baseUrl = config.WEB_APP_URL;
  const cacheKey = `ht-offline-cache-${action}`;

  // Helper to save to offline cache
  const saveToCache = (dataToCache: any) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    } catch (e) {
      console.warn('Could not save to localStorage cache:', e);
    }
  };

  // Helper to retrieve from offline cache
  const getFromCache = (): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (e) {
      console.warn('Could not read from localStorage cache:', e);
    }
    return null;
  };

  const isReadAction = action.startsWith('get');

  // If unconfigured or offline, try to serve cached data first without throwing 404 fetch errors
  if ((config.isUnconfigured || !navigator.onLine) && isReadAction) {
    const cachedData = getFromCache();
    if (cachedData !== null) {
      console.info(`[Cached Mode] Serving stored data for action: ${action}`);
      return cachedData;
    }
    if (config.isUnconfigured) {
      throw new Error(`API Web App URL is unconfigured. Please configure your Web App URL in Settings or GitHub Repository Secrets.`);
    }
  }

  try {
    if (method === 'GET') {
      const url = `${baseUrl}?action=${encodeURIComponent(action)}&token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of JSON (404 Not Found). Please verify your Google Apps Script Web App URL.`);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (pErr) {
        throw new Error(`Failed to parse JSON response for action [${action}].`);
      }

      if (data && data.success !== false) {
        const result = data.data !== undefined ? data.data : data;
        saveToCache(result);
        return result;
      }
      throw new Error(data.error || 'Failed to fetch GET data');
    } else {
      const bodyPayload = JSON.stringify({
        token,
        action,
        ...extraData
      });

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: bodyPayload
      });

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of JSON (404 Not Found). Please verify your Google Apps Script Web App URL.`);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (pErr) {
        throw new Error(`Failed to parse POST response for action [${action}].`);
      }

      if (data && data.success !== false) {
        if (isReadAction) {
          saveToCache(data.data !== undefined ? data.data : data);
        }
        return data;
      }
      throw new Error(data.error || 'Failed to execute POST operation');
    }
  } catch (err: any) {
    console.warn(`API Exception [${action}]:`, err?.message || err);

    // Fallback to offline cache for read actions if network or parsing fails
    if (isReadAction) {
      const cachedData = getFromCache();
      if (cachedData !== null) {
        console.info(`[Fallback Mode] Serving cached data for action: ${action}`);
        return cachedData;
      }
    }

    throw err;
  }
}

export const habitApi = {
  getDashboard: () => fetchApi<DashboardMetrics>('getDashboard'),
  getToday: () => fetchApi<TaskItem[]>('getToday'),
  getStreaks: () => fetchApi<StreakItem[]>('getStreaks'),
  getStatistics: () => fetchApi<StatisticsData>('getStatistics'),
  getTrends: () => fetchApi<TrendsData>('getTrends'),
  getCategories: () => fetchApi<CategoryData[]>('getCategories'),
  getMissed: () => fetchApi<MissedData>('getMissed'),
  getGoals: () => fetchApi<GoalItem[]>('getGoals'),
  getNotes: () => fetchApi<NoteItem[]>('getNotes'),
  getSettings: () => fetchApi<SettingsData>('getSettings'),
  getTaskLists: () => fetchApi<Array<{ id: string; title: string }>>('getTaskLists'),
  getBackup: () => fetchApi<any>('getBackup'),

  completeTask: (taskId: string, taskName: string, completed: boolean) =>
    fetchApi<{ success: boolean; taskId: string; status: string; completedAt: string }>('completeTask', 'POST', {
      taskId,
      taskName,
      completed
    }),

  addNote: (date: string, mood: string, energy: string, wins: string, challenges: string) =>
    fetchApi<{ success: boolean }>('addNote', 'POST', { date, mood, energy, wins, challenges }),

  setGoal: (task: string, period: string, target: number, unit: string) =>
    fetchApi<{ success: boolean }>('setGoal', 'POST', { task, period, target, unit }),

  updateSettings: (timezone: string, cutoffHour: number, categoryMap?: Record<string, string>) =>
    fetchApi<{ success: boolean }>('updateSettings', 'POST', { timezone, cutoffHour, categoryMap }),

  restoreBackup: (backupData: any) =>
    fetchApi<{ success: boolean; message?: string }>('restoreBackup', 'POST', { backup: backupData })
};
