import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { MissedData } from '../types';
import {
  AlertCircle,
  XCircle,
  Calendar,
  TrendingDown,
  Loader2,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface MissedScreenProps {
  onMissedLoaded?: (count: number) => void;
}

/**
 * MissedScreen – Displays habits that were missed today, missed this week grouped by day,
 * and frequently skipped tasks (>30% miss rate).
 */
export const MissedScreen: React.FC<MissedScreenProps> = ({ onMissedLoaded }) => {
  const [missedData, setMissedData] = useState<MissedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const loadMissed = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await habitApi.getMissed();
      setMissedData(data);
      if (onMissedLoaded && data?.missedToday) {
        onMissedLoaded(data.missedToday.length);
      }
    } catch (err) {
      console.error('Failed to load missed tasks data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [onMissedLoaded]);

  useEffect(() => {
    loadMissed();
  }, [loadMissed]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="text-sm text-slate-400">Loading missed tasks records…</span>
      </div>
    );
  }

  if (error || !missedData) {
    return (
      <div className="surface p-10 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">Unable to load missed tasks</h3>
          <p className="text-xs text-slate-400 mt-1">
            Failed to retrieve missed task metrics from the backend.
          </p>
        </div>
        <button
          onClick={loadMissed}
          className="btn btn-ghost mx-auto flex items-center gap-2 text-xs"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const {
    missedToday = [],
    missedThisWeekByDay = {},
    frequentlySkipped = []
  } = missedData;

  const weekdayKeys = Object.keys(missedThisWeekByDay);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* SECTION 1: Missed Today */}
      <div className="surface p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <XCircle size={20} className="text-rose-400" />
            <span>Missed Today ({missedToday.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Today's Cutoff</span>
        </div>

        {missedToday.length === 0 ? (
          <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl flex items-center gap-3 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <span>No habits missed today! All scheduled habits are completed or on track. 🎉</span>
          </div>
        ) : (
          <div className="space-y-2">
            {missedToday.map((taskName) => (
              <div
                key={taskName}
                className="bg-rose-950/30 border border-rose-800/40 p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold text-rose-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>{taskName}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-800/50">
                  Missed
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Missed This Week (Grouped by Day) */}
      <div className="surface p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calendar size={20} className="text-amber-400" />
            <span>Missed This Week (By Day)</span>
          </h2>
          <span className="text-xs text-slate-400">Last 7 Days</span>
        </div>

        {weekdayKeys.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No weekly missed task history recorded.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {weekdayKeys.map((dayName) => {
              const dayTasks = missedThisWeekByDay[dayName] || [];
              return (
                <div
                  key={dayName}
                  className="surface-elevated p-4 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
                    <span className="text-slate-200">{dayName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      dayTasks.length > 0
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/40 font-bold'
                        : 'bg-slate-900 text-slate-400'
                    }`}>
                      {dayTasks.length} missed
                    </span>
                  </div>

                  {dayTasks.length === 0 ? (
                    <span className="text-[11px] text-slate-500 block pt-1">All habits completed</span>
                  ) : (
                    <ul className="space-y-1.5 pt-1">
                      {dayTasks.map((t, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="truncate">{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Frequently Skipped Tasks (>30% miss rate) */}
      <div className="surface p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingDown size={20} className="text-rose-400" />
            <span>Frequently Skipped Habits (&gt;30% Miss Rate)</span>
          </h2>
          <span className="text-xs text-slate-400">Last 30 Days</span>
        </div>

        {frequentlySkipped.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No habits exceed the 30% miss rate threshold. Outstanding consistency! 🌟
          </div>
        ) : (
          <div className="space-y-3">
            {frequentlySkipped.map((item) => {
              const missRate = Math.round(item.missRatePct || 0);
              return (
                <div
                  key={item.taskName}
                  className="surface-elevated p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-100 truncate">{item.taskName}</h4>
                      <span className="text-xs text-slate-400">
                        Skipped {item.missedCount} out of {item.totalScheduled} scheduled sessions
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-rose-400 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/40 inline-block">
                        {missRate}% Miss Rate
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, missRate))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
