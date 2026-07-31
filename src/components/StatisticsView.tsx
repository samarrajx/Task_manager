import React from 'react';
import type { StatisticsData, TrendsData } from '../types';
import { BarChart3, TrendingUp, Calendar, Zap, Sparkles } from 'lucide-react';

interface StatisticsViewProps {
  stats: StatisticsData | null;
  trends: TrendsData | null;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ stats, trends }) => {
  const dailyPct = stats?.dailyPct ?? 0;
  const weeklyPct = stats?.weeklyPct ?? 0;
  const monthlyPct = stats?.monthlyPct ?? 0;

  const weekdayBreakdown = trends?.weekdayBreakdown || {};
  const weeklySeries = trends?.weeklySeries || [];
  // monthlySeries available via trends?.monthlySeries for future use

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>Analytics & Trends</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical completion breakdown, best performing days, and long-term progress trends.
        </p>
      </div>

      {/* Completion Period Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Today's Completion</div>
          <div className="text-3xl font-extrabold text-white mt-2">{dailyPct}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${dailyPct}%` }} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Last 7 Days Average</div>
          <div className="text-3xl font-extrabold text-teal-300 mt-2">{weeklyPct}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-teal-400 h-2 rounded-full" style={{ width: `${weeklyPct}%` }} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase">Last 30 Days Average</div>
          <div className="text-3xl font-extrabold text-purple-300 mt-2">{monthlyPct}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${monthlyPct}%` }} />
          </div>
        </div>
      </div>

      {/* Habit Insights Cards (Most Consistent & Most Skipped) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Most Consistent Habit</span>
            </span>
            <h4 className="text-lg font-bold text-slate-100 mt-1">{stats?.mostConsistent || 'N/A'}</h4>
            <p className="text-xs text-slate-400 mt-1">Requires min. 14 days history</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-400 uppercase flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Most Skipped Habit</span>
            </span>
            <h4 className="text-lg font-bold text-slate-100 mt-1">{stats?.mostSkipped || 'N/A'}</h4>
            <p className="text-xs text-slate-400 mt-1">Requires min. 14 days history</p>
          </div>
        </div>
      </div>

      {/* Weekday Breakdown Bar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Completion Rate by Weekday</span>
          </h3>
          <div className="text-xs text-slate-400">
            Best: <span className="text-emerald-400 font-bold">{trends?.bestDay || 'N/A'}</span> | Worst: <span className="text-rose-400 font-bold">{trends?.worstDay || 'N/A'}</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-4 items-end h-48 border-b border-slate-800 pb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
            const pct = weekdayBreakdown[day] || 0;
            return (
              <div key={day} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[11px] font-bold text-slate-300">{pct}%</span>
                <div
                  className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-500"
                  style={{ height: `${Math.max(8, pct)}%` }}
                />
                <span className="text-xs font-semibold text-slate-400">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly History Series Chart */}
      {weeklySeries.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span>Weekly Progress (Last 12 Weeks)</span>
          </h3>

          <div className="space-y-3">
            {weeklySeries.map((wk) => (
              <div key={wk.weekLabel} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-300">
                  <span>{wk.weekLabel}</span>
                  <span>{wk.completionPct}% ({wk.completed}/{wk.total})</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${wk.completionPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
