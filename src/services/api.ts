import { API_CONFIG } from '../config';
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
 * Enhanced fetchApi with offline caching & read-only fallback logic.
 * Saves last-fetched Dashboard, Today, Streaks, Statistics, Trends, etc. to localStorage.
 * When offline, falls back to cached data seamlessly.
 */
async function fetchApi<T>(action: string, method: 'GET' | 'POST' = 'GET', extraData: Record<string, any> = {}): Promise<T> {
  const token = API_CONFIG.SECRET_TOKEN;
  const baseUrl = API_CONFIG.WEB_APP_URL;
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

  // Check if browser is strictly offline for read action
  if (!navigator.onLine && isReadAction) {
    const cachedData = getFromCache();
    if (cachedData !== null) {
      console.info(`[Offline Mode] Serving cached data for action: ${action}`);
      return cachedData;
    }
  }

  try {
    if (method === 'GET') {
      const url = `${baseUrl}?action=${encodeURIComponent(action)}&token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      const data = await res.json();
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

      const data = await res.json();
      if (data && data.success !== false) {
        if (isReadAction) {
          saveToCache(data.data !== undefined ? data.data : data);
        }
        return data;
      }
      throw new Error(data.error || 'Failed to execute POST operation');
    }
  } catch (err: any) {
    console.warn(`API Exception [${action}]:`, err);

    // Fallback to offline cache for read actions if network fails
    if (isReadAction) {
      const cachedData = getFromCache();
      if (cachedData !== null) {
        console.info(`[Offline Fallback] Serving cached data for action: ${action}`);
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
