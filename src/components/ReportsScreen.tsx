import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { TaskItem, StreakItem, StatisticsData, MissedData } from '../types';
import { Download, FileText, Loader2, RefreshCw } from 'lucide-react';

type PeriodMode = 'weekly' | 'monthly';

/**
 * ReportsScreen – Weekly Summary & Monthly Summary report views with browser-generated CSV export.
 * Layout is intentionally minimal: plain typography, clean data tables, no decorative colors.
 */
export const ReportsScreen: React.FC = () => {
  const [mode, setMode] = useState<PeriodMode>('weekly');
  const [loading, setLoading] = useState<boolean>(true);

  // Raw fetched data
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [streaks, setStreaks] = useState<StreakItem[]>([]);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [missed, setMissed] = useState<MissedData | null>(null);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [tData, sData, stData, mData] = await Promise.all([
        habitApi.getToday().catch(() => []),
        habitApi.getStreaks().catch(() => []),
        habitApi.getStatistics().catch(() => null),
        habitApi.getMissed().catch(() => null)
      ]);
      setTasks(tData || []);
      setStreaks(sData || []);
      setStats(stData);
      setMissed(mData);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Client-side calculations
  const completionPct = mode === 'weekly' ? (stats?.weeklyPct ?? 0) : (stats?.monthlyPct ?? 0);
  const totalCompleted = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length;

  const activeStreaksCount = streaks.filter(s => s.current > 0).length;
  const topActiveStreak = streaks.length > 0 ? Math.max(...streaks.map(s => s.current)) : 0;
  const bestStreakEver = streaks.length > 0 ? Math.max(...streaks.map(s => s.best)) : 0;

  const missedItems = missed?.missedToday || [];
  const freqSkipped = missed?.frequentlySkipped || [];

  // Browser-based CSV Export Generator (No Backend Involved)
  const handleDownloadCSV = () => {
    const headers = ['Date', 'Task Name', 'Category', 'Priority', 'Status', 'Completed At', 'Is Optional'];
    const rows = tasks.map(t => [
      `"${t.date || new Date().toISOString().split('T')[0]}"`,
      `"${(t.taskName || '').replace(/"/g, '""')}"`,
      `"${(t.category || 'General').replace(/"/g, '""')}"`,
      `"${t.priority || 'Medium'}"`,
      `"${t.status || 'Pending'}"`,
      `"${t.completedAt || ''}"`,
      `"${t.isOptional ? 'Yes' : 'No'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const fileName = `habit_tracker_${mode}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-slate-400" size={28} />
        <span className="text-xs text-slate-400 font-mono">Generating report...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-200">
      {/* Top Toolbar: Mode Switcher & Download CSV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setMode('weekly')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
              mode === 'weekly'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly Summary
          </button>
          <button
            onClick={() => setMode('monthly')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
              mode === 'monthly'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly Summary
          </button>
        </div>

        {/* Download CSV Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadReportData}
            className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer min-h-[36px]"
            title="Reload data"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleDownloadCSV}
            className="btn btn-ghost text-xs flex items-center gap-2 border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 cursor-pointer min-h-[38px] px-4 font-semibold"
          >
            <Download size={14} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* REPORT CONTENT: Minimal typography layout */}
      <div className="space-y-6">
        {/* Report Header */}
        <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <FileText size={14} />
            <span className="uppercase tracking-wider">
              {mode === 'weekly' ? 'Weekly Executive Summary' : 'Monthly Performance Report'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Habit Consistency Audit ({new Date().toISOString().split('T')[0]})
          </h2>
          <p className="text-xs text-slate-400">
            Calculated client-side from synchronized Google Tasks history.
          </p>
        </div>

        {/* Key Metrics Table / Cards */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            1. Completion Rates & Streak Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
              <div className="text-xs text-slate-400">Period Completion</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{Math.round(completionPct)}%</div>
            </div>

            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
              <div className="text-xs text-slate-400">Tasks Completed</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{totalCompleted} / {totalTasks}</div>
            </div>

            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
              <div className="text-xs text-slate-400">Active Streaks</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{activeStreaksCount} habits</div>
            </div>

            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60">
              <div className="text-xs text-slate-400">Top / Best Streak</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">{topActiveStreak}d / {bestStreakEver}d</div>
            </div>
          </div>
        </div>

        {/* Streaks Audit Table */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            2. Active Habits & Streaks Audit
          </h3>
          <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-semibold">
                  <th className="py-2.5 px-4">Task Name</th>
                  <th className="py-2.5 px-4">Current Streak</th>
                  <th className="py-2.5 px-4">Best Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {streaks.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">No streak records available.</td>
                  </tr>
                ) : (
                  streaks.map(s => (
                    <tr key={s.task} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-4 font-semibold text-slate-200">{s.task}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-300">{s.current} days</td>
                      <td className="py-2.5 px-4 font-mono text-slate-300">{s.best} days</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missed Tasks Section */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
            3. Period Missed Tasks & Low Performance
          </h3>
          <div className="border border-slate-800 rounded-xl p-5 bg-slate-950/40 space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-300 mb-1">Missed Today ({missedItems.length})</div>
              {missedItems.length === 0 ? (
                <div className="text-xs text-slate-500">No tasks missed today.</div>
              ) : (
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {missedItems.map(m => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </div>

            {freqSkipped.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <div className="text-xs font-bold text-slate-300 mb-2">Frequently Skipped Tasks (&gt;30% miss rate)</div>
                <div className="space-y-1.5 text-xs">
                  {freqSkipped.map(f => (
                    <div key={f.taskName} className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-300 font-medium">{f.taskName}</span>
                      <span className="font-mono text-slate-400">{Math.round(f.missRatePct)}% miss rate ({f.missedCount}/{f.totalScheduled})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
