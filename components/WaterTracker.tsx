
import React from 'react';
import { Droplet, Plus, Minus } from 'lucide-react';

interface WaterTrackerProps {
  current: number; // ml
  goal?: number; // ml, default 2500
  onAdd: (amount: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({ current, goal = 2500, onAdd }) => {
  const percentage = Math.min(100, Math.max(0, (current / goal) * 100));

  return (
    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Droplet size={20} className="fill-blue-600 dark:fill-blue-400" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">Hydration</h3>
        </div>
        <div className="text-right">
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{current}</span>
            <div className="text-xs text-blue-400 font-medium">/ {goal} ml</div>
        </div>
      </div>

      <div className="relative h-24 w-full bg-blue-100/50 dark:bg-blue-900/30 rounded-xl overflow-hidden mb-4 border border-blue-200 dark:border-blue-800">
        <div 
            className="absolute bottom-0 left-0 w-full bg-blue-500 dark:bg-blue-600 transition-all duration-700 ease-in-out opacity-80"
            style={{ height: `${percentage}%` }}
        >
            <div className="w-full h-2 bg-blue-400/50 animate-pulse"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-blue-900/50 dark:text-blue-100/70 font-bold text-lg">{Math.round(percentage)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button 
            onClick={() => onAdd(250)}
            className="bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 py-2 rounded-lg text-sm font-semibold border border-blue-100 dark:border-blue-900 shadow-sm transition-colors flex items-center justify-center gap-1"
        >
            <Plus size={14} /> 250ml
        </button>
        <button 
            onClick={() => onAdd(-250)}
            className="bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 py-2 rounded-lg text-sm font-semibold border border-slate-100 dark:border-slate-700 shadow-sm transition-colors flex items-center justify-center gap-1"
        >
            <Minus size={14} /> Undo
        </button>
      </div>
    </div>
  );
};
