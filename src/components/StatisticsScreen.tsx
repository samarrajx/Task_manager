import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { StatisticsData } from '../types';
import {
  Percent,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  Loader2,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

/**
 * StatisticsScreen – displays key habit statistics in pure stat card format.
 * No charts used per user requirement.
 * Mobile: Stacked vertically.
 * Desktop: Grid layout.
 */
export const StatisticsScreen: React.FC = () => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await habitApi.getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="text-sm text-slate-400">Loading statistics…</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="surface p-10 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">Unable to load statistics</h3>
          <p className="text-xs text-slate-400 mt-1">
            Could not fetch completion metrics from Google Sheets.
          </p>
        </div>
        <button
          onClick={loadStatistics}
          className="btn btn-ghost mx-auto flex items-center gap-2 text-xs"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const {
    dailyPct = 0,
    weeklyPct = 0,
    monthlyPct = 0,
    totalCompleted = 0,
    totalMissed = 0,
    mostConsistent = 'N/A',
    mostSkipped = 'N/A'
  } = stats;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* SECTION 1: Completion Percentage Cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Completion Rates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Completion */}
          <div className="surface p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Percent size={14} className="text-indigo-400" />
                Daily Rate
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-medium">
                Today
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-100 tracking-tight">
                {Math.round(dailyPct)}%
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 mt-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, dailyPct))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weekly Completion */}
          <div className="surface p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-400" />
                Weekly Average
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-medium">
                Last 7 days
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-100 tracking-tight">
                {Math.round(weeklyPct)}%
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 mt-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, weeklyPct))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Monthly Completion */}
          <div className="surface p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-400" />
                Monthly Average
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-medium">
                Last 30 days
              </span>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-100 tracking-tight">
                {Math.round(monthlyPct)}%
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 mt-3 overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, monthlyPct))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: All-Time Totals */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Historical Totals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Completed */}
          <div className="surface-elevated p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Total Tasks Completed
              </span>
              <div className="text-3xl font-extrabold text-emerald-400">
                {totalCompleted.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Total Missed */}
          <div className="surface-elevated p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Total Tasks Missed
              </span>
              <div className="text-3xl font-extrabold text-rose-400">
                {totalMissed.toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-950/50 text-rose-400 border border-rose-800/40 flex items-center justify-center flex-shrink-0">
              <XCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Habit Highlights */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Habit Performance Insights
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Most Consistent Habit */}
          <div className="surface p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                Most Consistent Habit
              </span>
              <h3 className="text-lg font-bold text-slate-100 truncate" title={mostConsistent}>
                {mostConsistent || 'None (Min 14 days required)'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Highest overall completion reliability rate over 14+ days.
              </p>
            </div>
          </div>

          {/* Most Skipped Habit */}
          <div className="surface p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                Most Skipped Habit
              </span>
              <h3 className="text-lg font-bold text-slate-100 truncate" title={mostSkipped}>
                {mostSkipped || 'None'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Habit with the highest relative miss rate over recorded history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
