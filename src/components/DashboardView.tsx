import React from 'react';
import type { DashboardMetrics, TaskItem } from '../types';
import { Flame, CheckCircle2, AlertCircle, RefreshCw, Trophy, Calendar } from 'lucide-react';

interface DashboardViewProps {
  data: DashboardMetrics | null;
  todayTasks: TaskItem[];
  loading: boolean;
  onRefresh: () => void;
  onToggleTask: (taskId: string, name: string, completed: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  todayTasks,
  loading,
  onRefresh,
  onToggleTask
}) => {
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const completionPctStr = metrics["Today's Completion %"] || '0%';
  const completionVal = parseInt(completionPctStr, 10) || 0;
  const completedTotalStr = metrics["Today's Completed / Total"] || '0 / 0';
  const overallStreak = metrics['Overall Current Streak'] || '0 days';
  const longestStreak = metrics['Longest Streak (Any Task)'] || '0 days';
  const missedTodayStr = metrics['Missed Today'] || 'None';
  const lastUpdated = metrics['Last Updated'] || 'Never';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Today's Summary</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Last synced: {lastUpdated}</span>
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Sync</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Rate */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{completionPctStr}</div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completionVal))}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{completedTotalStr} habits completed today</p>
          </div>
        </div>

        {/* Overall Streak */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Streak</span>
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{overallStreak}</div>
            <p className="text-xs text-slate-400 mt-2">All habits completed consecutively</p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Best Single Streak</span>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight">{longestStreak}</div>
            <p className="text-xs text-slate-400 mt-2">Personal best habit record</p>
          </div>
        </div>

        {/* Missed Today Alert */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Missed Today</span>
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-4">
            <div className="text-lg font-bold text-rose-300 truncate">{missedTodayStr}</div>
            <p className="text-xs text-slate-400 mt-2">Habits flagged as missed today</p>
          </div>
        </div>
      </div>

      {/* Today's Habits List Quick View */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          <span>Today's Habits</span>
        </h3>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No habits found for today. Click <strong>Refresh Sync</strong> or sync Google Tasks.
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((t) => {
              const isComp = t.status === 'Completed';
              return (
                <div
                  key={t.taskId || t.taskName}
                  onClick={() => onToggleTask(t.taskId, t.taskName, !isComp)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer min-h-[52px] ${
                    isComp
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : t.status === 'Missed'
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isComp}
                      onChange={() => {}}
                      className="w-5 h-5 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`font-medium text-sm ${isComp ? 'line-through opacity-70' : ''}`}>
                      {t.taskName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.isOptional && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                        Optional
                      </span>
                    )}
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                        t.priority === 'High'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          : t.priority === 'Low'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                      }`}
                    >
                      {t.priority}
                    </span>
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
