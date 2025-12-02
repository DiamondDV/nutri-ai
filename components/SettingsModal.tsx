
import React, { useState } from 'react';
import { X, Save, Target } from 'lucide-react';
import { UserGoals } from '../types';

interface SettingsModalProps {
  currentGoals: UserGoals;
  onSave: (goals: UserGoals) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentGoals, onSave, onClose }) => {
  const [goals, setGoals] = useState<UserGoals>(currentGoals);

  const handleChange = (key: keyof UserGoals, value: string) => {
    setGoals(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(goals);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Target className="text-emerald-600 dark:text-emerald-400" size={20} />
            <h3 className="font-bold">Nutrition Goals</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Daily Calories</label>
                <input
                  type="number"
                  value={goals.calories}
                  onChange={(e) => handleChange('calories', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Daily Steps</label>
                <input
                  type="number"
                  value={goals.steps || 10000}
                  onChange={(e) => handleChange('steps', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Protein (g)</label>
              <input
                type="number"
                value={goals.protein}
                onChange={(e) => handleChange('protein', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={goals.carbs}
                onChange={(e) => handleChange('carbs', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fat (g)</label>
              <input
                type="number"
                value={goals.fat}
                onChange={(e) => handleChange('fat', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
