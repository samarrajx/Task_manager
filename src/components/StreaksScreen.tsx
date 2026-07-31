import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { StreakItem } from '../types';
import { Flame, Trophy, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Sparkles } from 'lucide-react';

type SortField = 'current' | 'best' | 'task';
type SortOrder = 'asc' | 'desc';

const MILESTONES = [
  { days: 7, label: '7-Day', icon: '🌱', title: '7 Days Streak Achieved' },
  { days: 30, label: '30-Day', icon: '⚡', title: '30 Days Streak Achieved' },
  { days: 100, label: '100-Day', icon: '🏆', title: '100 Days Streak Achieved' },
  { days: 365, label: '365-Day', icon: '👑', title: '365 Days Year-long Legend Achieved' }
];

/**
 * StreakMilestoneBadges – displays small, quiet milestone badges (7 / 30 / 100 / 365 days).
 * Icons only, no points or leaderboards.
 */
const StreakMilestoneBadges: React.FC<{ currentStreak: number; bestStreak: number }> = ({ currentStreak, bestStreak }) => {
  const maxDays = Math.max(currentStreak, bestStreak);
  return (
    <div className="flex items-center gap-1" title="Quiet streak milestones (7, 30, 100, 365 days)">
      {MILESTONES.map((m) => {
        const achieved = maxDays >= m.days;
        return (
          <span
            key={m.days}
            title={achieved ? m.title : `Unreached: ${m.days} days needed`}
            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] select-none transition-all ${
              achieved
                ? 'bg-slate-800 border border-slate-700/80 opacity-100 shadow-sm'
                : 'bg-slate-900/40 border border-slate-800/40 opacity-25 grayscale'
            }`}
          >
            {m.icon}
          </span>
        );
      })}
    </div>
  );
};

/**
 * StreaksScreen – displays streak data for habits with quiet milestone badges.
 * Mobile: Stacked cards view.
 * Desktop: Sortable table view.
 * Sorted by current streak descending by default.
 */
export const StreaksScreen: React.FC = () => {
  const [streaks, setStreaks] = useState<StreakItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortField, setSortField] = useState<SortField>('current');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const loadStreaks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await habitApi.getStreaks();
      setStreaks(data || []);
    } catch (e) {
      console.error('Failed to fetch streaks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedStreaks = [...streaks].sort((a, b) => {
    let comp = 0;
    if (sortField === 'current') {
      comp = a.current - b.current;
    } else if (sortField === 'best') {
      comp = a.best - b.best;
    } else {
      comp = a.task.localeCompare(b.task);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const totalActive = streaks.filter(s => s.current > 0).length;
  const longestCurrent = streaks.length > 0 ? Math.max(...streaks.map(s => s.current)) : 0;
  const bestEver = streaks.length > 0 ? Math.max(...streaks.map(s => s.best)) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="text-sm text-slate-400">Loading streak records…</span>
      </div>
    );
  }

  if (streaks.length === 0) {
    return (
      <div className="surface p-12 text-center rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-indigo-950/50 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Flame size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-200 mb-1">No Streaks Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Start completing your daily habits consistently to build up your active streaks and break personal records!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Streaks</div>
            <div className="text-xl font-bold text-slate-100">{totalActive} / {streaks.length}</div>
          </div>
        </div>

        <div className="surface p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Longest Current</div>
            <div className="text-xl font-bold text-slate-100">{longestCurrent} days</div>
          </div>
        </div>

        <div className="surface p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Best All-Time</div>
            <div className="text-xl font-bold text-slate-100">{bestEver} days</div>
          </div>
        </div>
      </div>

      {/* Sort Controls Bar (Mobile & Desktop) */}
      <div className="flex items-center justify-between gap-4 surface px-4 py-3 rounded-xl">
        <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Habit Streaks ({sortedStreaks.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Sort by:</span>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => handleSort('current')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] flex items-center gap-1 ${
                sortField === 'current'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current {sortField === 'current' && (sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
            </button>
            <button
              onClick={() => handleSort('best')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] flex items-center gap-1 ${
                sortField === 'best'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Best {sortField === 'best' && (sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
            </button>
            <button
              onClick={() => handleSort('task')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px] flex items-center gap-1 ${
                sortField === 'task'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Name {sortField === 'task' && (sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW: Stacked List */}
      <div className="space-y-3 md:hidden">
        {sortedStreaks.map((s) => {
          const isRecordHolding = s.current > 0 && s.current >= s.best;
          return (
            <div
              key={s.task}
              className="surface-elevated p-4 rounded-xl flex items-center justify-between gap-4 border border-slate-800 hover:border-slate-700 transition-colors min-h-[64px]"
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <span className="font-semibold text-sm text-slate-100 truncate">{s.task}</span>
                <div className="flex items-center gap-2">
                  <StreakMilestoneBadges currentStreak={s.current} bestStreak={s.best} />
                  {isRecordHolding && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-bold">
                      🔥 Record
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 border font-bold text-sm ${
                    s.current > 0
                      ? 'bg-amber-950/40 border-amber-800/50 text-amber-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <Flame size={16} className={s.current > 0 ? 'fill-amber-400' : 'text-slate-600'} />
                  <span>{s.current} {s.current === 1 ? 'day' : 'days'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Table */}
      <div className="hidden md:block surface rounded-xl overflow-hidden border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-400">
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors" onClick={() => handleSort('task')}>
                <div className="flex items-center gap-1.5">
                  <span>Habit Task Name</span>
                  {sortField === 'task' ? (
                    sortOrder === 'desc' ? <ArrowDown size={14} className="text-indigo-400" /> : <ArrowUp size={14} className="text-indigo-400" />
                  ) : (
                    <ArrowUpDown size={13} className="text-slate-600" />
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4">Milestones</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors" onClick={() => handleSort('current')}>
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" />
                  <span>Current Streak</span>
                  {sortField === 'current' ? (
                    sortOrder === 'desc' ? <ArrowDown size={14} className="text-indigo-400" /> : <ArrowUp size={14} className="text-indigo-400" />
                  ) : (
                    <ArrowUpDown size={13} className="text-slate-600" />
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors" onClick={() => handleSort('best')}>
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="text-indigo-400" />
                  <span>Personal Best</span>
                  {sortField === 'best' ? (
                    sortOrder === 'desc' ? <ArrowDown size={14} className="text-indigo-400" /> : <ArrowUp size={14} className="text-indigo-400" />
                  ) : (
                    <ArrowUpDown size={13} className="text-slate-600" />
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {sortedStreaks.map((s) => {
              const isRecordHolding = s.current > 0 && s.current >= s.best;
              return (
                <tr key={s.task} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-100">
                    {s.task}
                  </td>
                  <td className="py-3.5 px-4">
                    <StreakMilestoneBadges currentStreak={s.current} bestStreak={s.best} />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400 font-bold text-xs">
                      <Flame size={14} className="fill-amber-400" />
                      <span>{s.current} days</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 font-semibold text-xs">
                      <Trophy size={14} />
                      <span>{s.best} days</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {isRecordHolding ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                        Record Streak
                      </span>
                    ) : s.current > 0 ? (
                      <span className="text-xs text-slate-400">Active</span>
                    ) : (
                      <span className="text-xs text-slate-500">Inactive</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
