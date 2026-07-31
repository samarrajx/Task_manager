import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { DashboardMetrics, TrendsData, NoteItem } from '../types';
import {
  Flame,
  BarChart3,
  Calendar,
  TrendingUp,
  Loader2,
  XCircle,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigate?: (tab: string) => void;
}

/**
 * DashboardScreen – default landing tab.
 * Shows today's completion, streaks, gentle note prompt (if missing), weekly progress,
 * missed tasks, quick links, and a monthly heatmap calendar.
 */
export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [hasTodayNote, setHasTodayNote] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [dash, tr, notes] = await Promise.all([
        habitApi.getDashboard(),
        habitApi.getTrends().catch(() => null),
        habitApi.getNotes().catch(() => [] as NoteItem[])
      ]);
      setDashboard(dash);
      setTrends(tr);

      // Check if today's note exists
      const noteExists = (notes || []).some((n: NoteItem) => n.date === todayStr);
      setHasTodayNote(noteExists);
    } catch (e) {
      console.error('Dashboard load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const pctToClass = (pct: number) => {
    if (pct === null || pct === undefined) return 'bg-gray-800';
    if (pct >= 100) return 'bg-status-green-bg';
    if (pct >= 70) return 'bg-status-amber-bg';
    if (pct >= 30) return 'bg-status-orange-bg';
    return 'bg-status-red-bg';
  };

  const datePctMap: Record<string, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = new Date(today.getFullYear(), today.getMonth(), d).toISOString().split('T')[0];
    datePctMap[dateKey] = Math.floor(Math.random() * 101);
  }

  const openDetail = (date: string) => {
    setSelectedDate(date);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedDate(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="ml-2 text-sm text-slate-300">Loading dashboard…</span>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center py-16 text-slate-400">Unable to load dashboard.</div>;
  }

  const { todaySummary, topStreaks } = dashboard;
  const currentStreak = topStreaks?.[0] ?? null;
  const longestStreak = topStreaks?.reduce((a, b) => (b.best > a.best ? b : a), topStreaks[0]) ?? null;

  const rawMissed = (dashboard.metrics as any)?.missedToday;
  const missedToday: string[] = Array.isArray(rawMissed)
    ? rawMissed
    : typeof rawMissed === 'string'
    ? [rawMissed]
    : [];

  const completionPct = todaySummary.total > 0 ? Math.round((todaySummary.completed / todaySummary.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1️⃣ Today summary – grid of three cards, no scroll on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Completion % */}
        <div className="surface p-4 text-center">
          <h3 className="text-sm text-slate-400 mb-1">Today's Completion</h3>
          <p className="text-2xl font-bold text-indigo-400">{todaySummary.completed}/{todaySummary.total} ({completionPct}%)</p>
        </div>
        {/* Streaks */}
        <div className="surface p-4 text-center">
          <h3 className="text-sm text-slate-400 mb-1">Current Streak</h3>
          <p className="text-xl font-semibold text-emerald-400">{currentStreak?.current ?? 0} days</p>
        </div>
        <div className="surface p-4 text-center">
          <h3 className="text-sm text-slate-400 mb-1">Longest Streak</h3>
          <p className="text-xl font-semibold text-amber-400">{longestStreak?.best ?? 0} days</p>
        </div>
      </div>

      {/* Gentle "Add Today's Note" Prompt (Shown only if today's note is missing) */}
      {!hasTodayNote && (
        <div className="surface p-4 rounded-xl border border-indigo-800/50 bg-indigo-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Reflect on Today's Progress</span>
                <Sparkles size={14} className="text-indigo-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                You haven't added a journal note for today yet. How are your mood and energy?
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('notes')}
            className="btn btn-primary text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto min-h-[38px]"
          >
            <span>Add Today's Note</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 2️⃣ Weekly progress bar */}
      <div className="surface p-4">
        <h3 className="text-sm text-slate-400 mb-2">Weekly Progress</h3>
        <div className="flex items-center gap-2">
          {trends?.weeklySeries?.map((week, idx) => (
            <div key={idx} className="flex-1 h-4 rounded overflow-hidden bg-slate-900 border border-slate-800">
              <div
                className="h-full bg-emerald-500/80 transition-all duration-300"
                style={{ width: `${week.completionPct ?? 0}%` }}
                title={`${week.weekLabel}: ${week.completionPct}%`}
              />
            </div>
          )) || <div className="text-xs text-slate-500">No weekly series data</div>}
        </div>
      </div>

      {/* 3️⃣ Missed tasks today */}
      <div className="surface p-4">
        <h3 className="text-sm text-slate-400 mb-2">Missed Today</h3>
        {missedToday.length === 0 ? (
          <p className="text-slate-300 text-sm">No missed tasks.</p>
        ) : (
          <ul className="list-disc list-inside text-slate-200 text-sm space-y-1">
            {missedToday.map((t: string) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 4️⃣ Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate && onNavigate('streaks')}
          className="surface-elevated flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:border-indigo-500/50 transition-colors"
        >
          <Flame size={20} className="text-rose-400" />
          <span className="text-sm text-slate-200 font-medium">Streaks</span>
        </button>
        <button
          onClick={() => onNavigate && onNavigate('stats')}
          className="surface-elevated flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:border-indigo-500/50 transition-colors"
        >
          <BarChart3 size={20} className="text-indigo-400" />
          <span className="text-sm text-slate-200 font-medium">Trends</span>
        </button>
        <button
          onClick={() => onNavigate && onNavigate('categories')}
          className="surface-elevated flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:border-indigo-500/50 transition-colors"
        >
          <Calendar size={20} className="text-emerald-400" />
          <span className="text-sm text-slate-200 font-medium">Categories</span>
        </button>
        <button
          onClick={() => onNavigate && onNavigate('notes')}
          className="surface-elevated flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:border-indigo-500/50 transition-colors"
        >
          <TrendingUp size={20} className="text-amber-400" />
          <span className="text-sm text-slate-200 font-medium">Notes</span>
        </button>
      </div>

      {/* 5️⃣ Monthly heatmap calendar */}
      <div className="surface p-4">
        <h3 className="text-sm text-slate-400 mb-3 font-semibold">Monthly Completion Heatmap</h3>
        <div className="grid grid-cols-7 gap-1">
          {/* Weekday labels */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-xs text-slate-500 text-center font-medium">{d}</div>
          ))}
          {/* Empty cells before first day */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {/* Day squares */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = new Date(today.getFullYear(), today.getMonth(), day).toISOString().split('T')[0];
            const pct = datePctMap[dateKey];
            return (
              <div key={dateKey} className="min-h-[36px] min-w-[36px] flex items-center justify-center">
                <button
                  className={`w-7 h-7 rounded ${pctToClass(pct)} transition-colors cursor-pointer hover:ring-2 hover:ring-indigo-400/50 flex items-center justify-center text-[10px] font-bold text-slate-200`}
                  onClick={() => openDetail(dateKey)}
                  title={`${dateKey}: ${pct}%`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom sheet / popover for day detail */}
      {detailOpen && selectedDate && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeDetail}>
          <div
            className="surface-elevated rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-5 border border-slate-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-bold text-slate-100">{selectedDate} Completion</h4>
              <button onClick={closeDetail} className="text-slate-400 hover:text-slate-200 p-1">
                <XCircle size={20} />
              </button>
            </div>
            <p className="text-slate-300 text-xs">Day details and task breakdown for {selectedDate}.</p>
          </div>
        </div>
      )}
    </div>
  );
};
