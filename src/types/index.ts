export interface TaskItem {
  date: string;
  taskId: string;
  taskName: string;
  status: 'Completed' | 'Pending' | 'Missed' | string;
  completedAt: string | null;
  priority: 'High' | 'Medium' | 'Low' | string;
  category: string;
  isOptional: boolean;
}

export interface StreakItem {
  task: string;
  current: number;
  best: number;
}

export interface GoalItem {
  task: string;
  period: 'Daily' | 'Weekly' | 'Monthly' | string;
  target: number;
  unit: string;
}

export interface NoteItem {
  date: string;
  mood: string;
  energy: string;
  wins: string;
  challenges: string;
}

export interface DashboardMetrics {
  metrics: Record<string, string>;
  todaySummary: {
    total: number;
    completed: number;
    pending: number;
    missed: number;
  };
  topStreaks: StreakItem[];
}

export interface StatisticsData {
  dailyPct: number;
  weeklyPct: number;
  monthlyPct: number;
  totalCompleted: number;
  totalMissed: number;
  mostConsistent: string;
  mostSkipped: string;
}

export interface TrendsData {
  weekdayBreakdown: Record<string, number>;
  bestDay: string;
  worstDay: string;
  weeklySeries: Array<{ weekLabel: string; completionPct: number; completed: number; total: number }>;
  monthlySeries: Array<{ monthLabel: string; completionPct: number; completed: number; total: number }>;
}

export interface CategoryData {
  category: string;
  completed: number;
  missed: number;
  total: number;
  completionPct: number;
}

export interface MissedData {
  missedToday: string[];
  missedThisWeekByDay: Record<string, string[]>;
  frequentlySkipped: Array<{ taskName: string; missRatePct: number; missedCount: number; totalScheduled: number }>;
}

export interface SettingsData {
  timezone: string;
  cutoffHour: number;
  categoryMap: Record<string, string>;
}
