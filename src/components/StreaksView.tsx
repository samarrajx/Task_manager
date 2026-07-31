import React, { useState } from 'react';
import type { StreakItem, TaskItem } from '../types';
import { Flame, Trophy, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface StreaksViewProps {
  streaks: StreakItem[];
  historyTasks?: TaskItem[];
}

export const StreaksView: React.FC<StreaksViewProps> = ({ streaks, historyTasks = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-based

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map history by date YYYY-MM-DD for heatmap
  const dateMap: Record<string, { completed: number; total: number }> = {};
  historyTasks.forEach(t => {
    if (t.date) {
      if (!dateMap[t.date]) dateMap[t.date] = { completed: 0, total: 0 };
      dateMap[t.date].total++;
      if (t.status === 'Completed') dateMap[t.date].completed++;
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
            <span>Habit Streaks & Monthly Heatmap</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracks current consecutive completion streaks & personal best records.
          </p>
        </div>
      </div>

      {/* Streaks Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {streaks.length === 0 ? (
          <div className="col-span-2 glass-card p-8 rounded-2xl text-center text-slate-400 text-sm">
            No streak records available yet. Complete habits to start building your streak!
          </div>
        ) : (
          streaks.map((s) => (
            <div key={s.task} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-100">{s.task}</h4>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Flame className="w-4 h-4 fill-amber-500/30" />
                    <span>Current: {s.current} days</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                    <Trophy className="w-4 h-4" />
                    <span>Best: {s.best} days</span>
                  </div>
                </div>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-lg font-black text-amber-400">{s.current}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Monthly Heatmap Calendar View */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <span>{monthNames[month]} {year}</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center font-semibold text-xs text-slate-400 border-b border-slate-800 pb-2">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-12 rounded-xl bg-slate-950/20" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const info = dateMap[dateStr];

            let bgColor = 'bg-slate-900/60 border-slate-800/80 text-slate-300';
            if (info && info.total > 0) {
              const pct = Math.round((info.completed / info.total) * 100);
              if (pct === 100) bgColor = 'bg-emerald-600/40 border-emerald-500/50 text-emerald-100 font-bold';
              else if (pct >= 50) bgColor = 'bg-amber-600/30 border-amber-500/40 text-amber-100';
              else bgColor = 'bg-rose-950/40 border-rose-800/50 text-rose-200';
            }

            return (
              <div
                key={dateStr}
                className={`h-12 rounded-xl border p-1.5 flex flex-col justify-between text-xs transition ${bgColor}`}
              >
                <span className="font-semibold text-[11px]">{dayNum}</span>
                {info && info.total > 0 && (
                  <span className="text-[9px] opacity-80">{info.completed}/{info.total}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-600/40 border border-emerald-500/50" />
            <span>100% Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-600/30 border border-amber-500/40" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-rose-950/40 border border-rose-800/50" />
            <span>Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
