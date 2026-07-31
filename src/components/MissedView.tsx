import React from 'react';
import type { MissedData } from '../types';
import { AlertCircle, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MissedViewProps {
  missed: MissedData | null;
}

export const MissedView: React.FC<MissedViewProps> = ({ missed }) => {
  const missedToday = missed?.missedToday || [];
  const missedThisWeekByDay = missed?.missedThisWeekByDay || {};
  const frequentlySkipped = missed?.frequentlySkipped || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <AlertCircle className="w-6 h-6 text-rose-400" />
          <span>Missed Habits Tracker</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Surfaces habits missed today, missed this week, and frequently skipped habits (&gt;30% miss rate).
        </p>
      </div>

      {/* Missed Today Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-rose-800/40 bg-rose-950/20 space-y-3">
        <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Missed Today ({missedToday.length})</span>
        </h3>

        {missedToday.length === 0 ? (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Great job! No habits missed today.</span>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {missedToday.map((item, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-xl bg-rose-900/40 text-rose-200 border border-rose-700/50 font-medium">
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Frequently Skipped Habits (>30% miss rate over 30 days) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Frequently Skipped Habits (&gt;30% Miss Rate)</span>
        </h3>

        {frequentlySkipped.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No habits exceed the 30% miss rate threshold over the last 30 days.
          </div>
        ) : (
          <div className="space-y-3">
            {frequentlySkipped.map((item) => (
              <div key={item.taskName} className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100 text-sm">{item.taskName}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Missed {item.missedCount} out of {item.totalScheduled} scheduled days
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-rose-400 bg-rose-950/60 px-3 py-1 rounded-xl border border-rose-800/40">
                    {item.missRatePct}% Miss Rate
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missed This Week Grouped By Day */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <span>Missed This Week (By Day)</span>
        </h3>

        {Object.keys(missedThisWeekByDay).length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No habits recorded as missed in the past 7 days.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(missedThisWeekByDay).map(([dateStr, items]) => (
              <div key={dateStr} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-semibold text-xs text-indigo-300">{dateStr}</span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((it, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
