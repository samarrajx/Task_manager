import React, { useState } from 'react';
import type { TaskItem } from '../types';
import { CheckSquare, Filter, Search, CheckCircle2, Clock, XCircle, Sparkles } from 'lucide-react';

interface TodayViewProps {
  tasks: TaskItem[];
  loading: boolean;
  onToggleTask: (taskId: string, name: string, completed: boolean) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ tasks, onToggleTask }) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', ...Array.from(new Set(tasks.map(t => t.category || 'General')))];

  const filteredTasks = tasks.filter(t => {
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesSearch = t.taskName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPriority && matchesSearch;
  });

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header & Progress */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            <span>Today's Habits Checklist</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tap any habit to mark it completed or pending. Changes sync to Google Tasks API.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-300">Daily Progress</div>
            <div className="text-xl font-extrabold text-indigo-400">{completedCount} / {totalCount}</div>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className="text-indigo-500 transition-all duration-500"
                fill="transparent"
                strokeDasharray={138}
                strokeDashoffset={138 - (138 * progressPct) / 100}
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span>Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-slate-200">All</option>
              <option value="High" className="bg-slate-900 text-slate-200">High</option>
              <option value="Medium" className="bg-slate-900 text-slate-200">Medium</option>
              <option value="Low" className="bg-slate-900 text-slate-200">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center text-slate-400 text-sm">
            No habits found matching your filters.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isComp = t.status === 'Completed';
            const isMissed = t.status === 'Missed';

            return (
              <div
                key={t.taskId || t.taskName}
                onClick={() => onToggleTask(t.taskId, t.taskName, !isComp)}
                className={`glass-card p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 min-h-[56px] ${
                  isComp
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                    : isMissed
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-100'
                    : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isComp
                        ? 'bg-emerald-500 text-white'
                        : isMissed
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        : 'border-2 border-slate-600 hover:border-indigo-500'
                    }`}
                  >
                    {isComp && <CheckCircle2 className="w-4 h-4" />}
                    {isMissed && <XCircle className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className={`font-semibold text-sm ${isComp ? 'line-through opacity-70' : 'text-slate-100'}`}>
                      {t.taskName}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{t.category || 'General'}</span>
                      {t.completedAt && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                          <Clock className="w-3 h-3" />
                          <span>Done at {t.completedAt.split(' ')[1] || t.completedAt}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {t.isOptional && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-medium flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Optional</span>
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
          })
        )}
      </div>
    </div>
  );
};
