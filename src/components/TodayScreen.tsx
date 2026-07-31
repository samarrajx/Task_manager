import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { TaskItem, GoalItem } from '../types';
import { CheckCircle2, XCircle, Clock, Sparkles, Loader2, Target, Filter, X, ChevronDown, ChevronRight, Tag } from 'lucide-react';

interface TodayScreenProps {
  filterCategory?: string | null;
  onClearFilter?: () => void;
}

/**
 * TodayScreen – fetches today's tasks grouped by category (matching Google Tasks list grouping).
 * Supports category filtering with a clearable filter chip.
 * Each category section is collapsible with a completion count badge.
 * Optimistic UI: updates local state immediately, rolls back on failure.
 */
export const TodayScreen: React.FC<TodayScreenProps> = ({ filterCategory, onClearFilter }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayData, goalsData] = await Promise.all([
        habitApi.getToday().catch(() => []),
        habitApi.getGoals().catch(() => [])
      ]);
      setTasks(todayData || []);
      setGoals(goalsData || []);
    } catch (e) {
      console.error('Failed to load today tasks', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTask = async (taskId: string, name: string, currentlyCompleted: boolean) => {
    setTasks(prev =>
      prev.map(t =>
        t.taskId === taskId
          ? { ...t, status: currentlyCompleted ? 'Pending' : 'Completed', completedAt: currentlyCompleted ? null : new Date().toISOString() }
          : t
      )
    );
    setTogglingIds(prev => new Set(prev).add(taskId));
    try {
      await habitApi.completeTask(taskId, name, !currentlyCompleted);
    } catch (err) {
      setTasks(prev =>
        prev.map(t => (t.taskId === taskId ? { ...t, status: currentlyCompleted ? 'Completed' : 'Pending', completedAt: currentlyCompleted ? new Date().toISOString() : null } : t))
      );
      console.error('Toggle failed', err);
    } finally {
      setTogglingIds(prev => {
        const copy = new Set(prev);
        copy.delete(taskId);
        return copy;
      });
    }
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const copy = new Set(prev);
      if (copy.has(category)) copy.delete(category);
      else copy.add(category);
      return copy;
    });
  };

  // Apply category filter if active
  const displayedTasks = filterCategory
    ? tasks.filter(t => (t.category || 'General').toLowerCase() === filterCategory.toLowerCase())
    : tasks;

  // Group tasks by category, preserving insertion order (same as Google Tasks list order)
  const categoryGroups: { category: string; tasks: TaskItem[] }[] = [];
  const seenCategories = new Map<string, number>();
  for (const task of displayedTasks) {
    const cat = task.category || 'General';
    if (!seenCategories.has(cat)) {
      seenCategories.set(cat, categoryGroups.length);
      categoryGroups.push({ category: cat, tasks: [] });
    }
    categoryGroups[seenCategories.get(cat)!].tasks.push(task);
  }

  // Sort: incomplete categories first, then by name
  categoryGroups.sort((a, b) => {
    const aAllDone = a.tasks.every(t => t.status === 'Completed');
    const bAllDone = b.tasks.every(t => t.status === 'Completed');
    if (aAllDone !== bAllDone) return aAllDone ? 1 : -1;
    return a.category.localeCompare(b.category);
  });

  // Category colour palette — cycles through a set of hues
  const categoryPalette = [
    { ring: 'ring-indigo-500/60', bg: 'bg-indigo-950/30', text: 'text-indigo-300', dot: 'bg-indigo-500' },
    { ring: 'ring-violet-500/60', bg: 'bg-violet-950/30', text: 'text-violet-300', dot: 'bg-violet-500' },
    { ring: 'ring-cyan-500/60',   bg: 'bg-cyan-950/30',   text: 'text-cyan-300',   dot: 'bg-cyan-500'   },
    { ring: 'ring-amber-500/60',  bg: 'bg-amber-950/30',  text: 'text-amber-300',  dot: 'bg-amber-500'  },
    { ring: 'ring-rose-500/60',   bg: 'bg-rose-950/30',   text: 'text-rose-300',   dot: 'bg-rose-500'   },
    { ring: 'ring-emerald-500/60',bg: 'bg-emerald-950/30',text: 'text-emerald-300',dot: 'bg-emerald-500' },
    { ring: 'ring-pink-500/60',   bg: 'bg-pink-950/30',   text: 'text-pink-300',   dot: 'bg-pink-500'   },
    { ring: 'ring-sky-500/60',    bg: 'bg-sky-950/30',    text: 'text-sky-300',    dot: 'bg-sky-500'    },
  ];
  const getPalette = (index: number) => categoryPalette[index % categoryPalette.length];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="ml-2 text-sm text-slate-300">Loading today's habits…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Category Filter Active Chip */}
      {filterCategory && (
        <div className="surface p-3 sm:p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <Filter size={15} className="text-indigo-400 flex-shrink-0" />
            <span>
              Filtered by: <strong className="text-white px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/50">{filterCategory}</strong>
            </span>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              ({displayedTasks.length} of {tasks.length} tasks)
            </span>
          </div>

          {onClearFilter && (
            <button
              onClick={onClearFilter}
              className="btn btn-ghost text-xs flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer min-h-[36px] px-2.5"
              title="Clear category filter"
            >
              <span>Show all</span>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {displayedTasks.length === 0 ? (
        <div className="surface p-10 text-center rounded-2xl border border-slate-800 space-y-4 max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              {filterCategory ? `No habits in "${filterCategory}"` : 'No Habits Scheduled For Today'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {filterCategory
                ? `There are no scheduled habits matching category "${filterCategory}".`
                : 'Add tasks in your Google Tasks lists, or click refresh below to fetch the latest habits.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            {filterCategory && onClearFilter && (
              <button
                onClick={onClearFilter}
                className="btn btn-ghost text-xs px-4 py-2 cursor-pointer"
              >
                Clear Category Filter
              </button>
            )}
            <button
              onClick={loadData}
              className="btn btn-primary text-xs flex items-center gap-1.5 px-4 py-2 cursor-pointer"
            >
              <span>Refresh Today's Tasks</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary row */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              <span className="font-semibold text-slate-200">{displayedTasks.filter(t => t.status === 'Completed').length}</span>
              {' / '}
              <span className="font-semibold text-slate-200">{displayedTasks.length}</span>
              {' habits completed'}
            </span>
            <span>{categoryGroups.length} {categoryGroups.length === 1 ? 'category' : 'categories'}</span>
          </div>

          {/* Category sections */}
          {categoryGroups.map(({ category, tasks: catTasks }, groupIdx) => {
            const palette = getPalette(groupIdx);
            const completedCount = catTasks.filter(t => t.status === 'Completed').length;
            const totalCount = catTasks.length;
            const allDone = completedCount === totalCount;
            const isCollapsed = collapsedCategories.has(category);
            const pct = Math.round((completedCount / totalCount) * 100);

            return (
              <div key={category} className={`surface rounded-2xl border ${allDone ? 'border-emerald-800/40' : 'border-slate-800'} overflow-hidden`}>
                {/* Category Header — click to collapse */}
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 gap-3 cursor-pointer transition-colors ${allDone ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'bg-slate-900/60 hover:bg-slate-800/60'}`}
                  onClick={() => toggleCategoryCollapse(category)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Coloured dot */}
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${allDone ? 'bg-emerald-500' : palette.dot}`} />
                    <Tag size={13} className={`flex-shrink-0 ${allDone ? 'text-emerald-400' : palette.text}`} />
                    <span className={`font-bold text-sm truncate ${allDone ? 'text-emerald-200' : 'text-slate-100'}`}>
                      {category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Progress pill */}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      allDone
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40'
                        : `${palette.bg} ${palette.text} ring-1 ${palette.ring}`
                    }`}>
                      {completedCount}/{totalCount}
                    </span>

                    {/* Collapse chevron */}
                    {isCollapsed
                      ? <ChevronRight size={15} className="text-slate-500" />
                      : <ChevronDown size={15} className="text-slate-500" />
                    }
                  </div>
                </button>

                {/* Mini progress bar */}
                {!isCollapsed && (
                  <div className="h-0.5 bg-slate-800/80">
                    <div
                      className={`h-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : palette.dot}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {/* Task list */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-800/60">
                    {catTasks.map(task => {
                      const isComp = task.status === 'Completed';
                      const isMissed = task.status === 'Missed';
                      const isToggling = togglingIds.has(task.taskId);
                      const matchingGoal = goals.find(g => g.task === task.taskName);
                      const goalTarget = matchingGoal?.target || 1;
                      const goalCurrent = isComp ? 1 : 0;
                      const goalPct = Math.round((goalCurrent / goalTarget) * 100);

                      return (
                        <button
                          key={task.taskId || task.taskName}
                          className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer flex flex-col gap-2 ${
                            isComp
                              ? 'bg-emerald-950/10 hover:bg-emerald-950/20'
                              : isMissed
                              ? 'bg-rose-950/10 hover:bg-rose-950/20'
                              : 'hover:bg-slate-800/40'
                          } ${isToggling ? 'opacity-60 pointer-events-none' : ''}`}
                          onClick={() => toggleTask(task.taskId, task.taskName, isComp)}
                        >
                          <div className="flex items-center justify-between gap-4 min-h-[40px]">
                            {/* Left – status icon & task name */}
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors flex-shrink-0 ${
                                  isComp
                                    ? 'bg-emerald-500 text-white'
                                    : isMissed
                                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                                    : 'border-2 border-slate-600 hover:border-indigo-500'
                                }`}
                              >
                                {isComp && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {isMissed && <XCircle className="w-3.5 h-3.5" />}
                              </div>

                              <div className="flex flex-col items-start">
                                <span className={`font-medium text-sm leading-snug ${isComp ? 'line-through opacity-60 text-slate-300' : isMissed ? 'text-rose-200' : 'text-slate-100'}`}>
                                  {task.taskName}
                                </span>
                                {task.completedAt && (
                                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    Done at {task.completedAt.split(' ')[1]?.substring(0, 5) || task.completedAt}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Right – badges */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {task.isOptional && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-medium flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Optional
                                </span>
                              )}
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                  task.priority === 'High'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                    : task.priority === 'Low'
                                    ? 'bg-slate-900 text-slate-400 border border-slate-800'
                                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                                }`}
                              >
                                {task.priority || 'Medium'}
                              </span>
                            </div>
                          </div>

                          {/* Goal Progress Bar */}
                          {matchingGoal && (
                            <div className="pt-2 border-t border-slate-800/50 flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Target size={12} className="text-indigo-400" />
                                <span className="font-semibold text-slate-200">Goal:</span>
                                <span>{goalCurrent}/{goalTarget} {matchingGoal.unit} ({matchingGoal.period})</span>
                              </div>
                              <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-indigo-500 transition-all duration-300"
                                  style={{ width: `${Math.min(100, goalPct)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
