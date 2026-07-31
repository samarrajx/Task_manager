import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { CategoryData } from '../types';
import {
  PieChart,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  ArrowRight,
  Folder
} from 'lucide-react';

interface CategoriesScreenProps {
  onSelectCategory?: (category: string) => void;
}

/**
 * CategoriesScreen – displays completion breakdown per category as a horizontal bar list.
 * Allows filtering or scoping views to a specific category.
 */
export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await habitApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="text-sm text-slate-400">Loading categories breakdown…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface p-10 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center justify-center mx-auto">
          <XCircle size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">Unable to load categories</h3>
          <p className="text-xs text-slate-400 mt-1">
            Failed to retrieve category metrics from Google Sheets API.
          </p>
        </div>
        <button
          onClick={loadCategories}
          className="btn btn-ghost mx-auto flex items-center gap-2 text-xs"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="surface p-12 text-center rounded-2xl">
        <Folder size={32} className="text-indigo-400 mx-auto mb-3 opacity-60" />
        <h3 className="text-base font-bold text-slate-200 mb-1">No Categories Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Configure category mappings in your Google Sheet's Config tab to group habits by category.
        </p>
      </div>
    );
  }

  const categoryNames = ['All', ...categories.map(c => c.category)];

  const filteredCategories = selectedFilter === 'All'
    ? categories
    : categories.filter(c => c.category === selectedFilter);

  const totalTasksAll = categories.reduce((sum, c) => sum + c.total, 0);
  const totalCompletedAll = categories.reduce((sum, c) => sum + c.completed, 0);
  const overallAvgPct = totalTasksAll > 0 ? Math.round((totalCompletedAll / totalTasksAll) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Card */}
      <div className="surface p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-400" />
            <span>Category Performance Breakdown</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Overall completion rates across {categories.length} active habit categories.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-400">Average Rate</div>
            <div className="text-lg font-extrabold text-indigo-400">{overallAvgPct}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 flex items-center justify-center font-bold text-sm">
            {categories.length}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="surface p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter size={14} className="text-indigo-400" />
          <span>Filter View by Category:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedFilter(cat);
                if (onSelectCategory && cat !== 'All') {
                  onSelectCategory(cat);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              <span>{cat}</span>
              {cat !== 'All' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {categories.find(c => c.category === cat)?.total || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Bar List */}
      <div className="space-y-4">
        {filteredCategories.map((item) => {
          const pct = Math.round(item.completionPct || (item.total > 0 ? (item.completed / item.total) * 100 : 0));
          const isHigh = pct >= 80;
          const isLow = pct < 40;

          return (
            <div
              key={item.category}
              className="surface-elevated p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{item.category}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 size={12} />
                        {item.completed} completed
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <XCircle size={12} className="text-slate-500" />
                        {item.missed} missed
                      </span>
                      <span className="text-slate-500">• {item.total} total habits</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className={`text-xl font-extrabold ${isHigh ? 'text-emerald-400' : isLow ? 'text-rose-400' : 'text-indigo-400'}`}>
                    {pct}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                    Completion
                  </span>
                </div>
              </div>

              {/* Horizontal Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHigh
                      ? 'bg-emerald-500'
                      : isLow
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>

              {/* Optional Quick Action Footer */}
              {onSelectCategory && (
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onSelectCategory(item.category)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors py-1 cursor-pointer"
                  >
                    <span>Filter habits in Today view</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
