import React from 'react';
import type { CategoryData } from '../types';
import { PieChart, CheckCircle2, XCircle } from 'lucide-react';

interface CategoriesViewProps {
  categories: CategoryData[];
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ categories }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <PieChart className="w-6 h-6 text-indigo-400" />
          <span>Category Breakdown</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Completion rates and totals grouped by mapped Google Tasks list categories.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center text-slate-400 text-sm">
          No category statistics available yet. Ensure your Google Tasks lists are mapped in Config.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div key={cat.category} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-slate-100">{cat.category}</h4>
                <span className="text-xl font-extrabold text-indigo-400">{cat.completionPct}%</span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${cat.completionPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{cat.completed} Completed</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="w-4 h-4" />
                  <span>{cat.missed} Missed</span>
                </div>
                <span>Total: {cat.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
