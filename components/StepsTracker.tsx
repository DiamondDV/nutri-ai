
import React, { useState, useEffect } from 'react';
import { Footprints, Edit2, Check, Flame, Timer, MapPin, Plus } from 'lucide-react';

interface StepsTrackerProps {
  current: number;
  goal: number;
  onUpdate: (steps: number) => void;
}

export const StepsTracker: React.FC<StepsTrackerProps> = ({ current, goal, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(current.toString());

  useEffect(() => {
    setInputValue(current.toString());
  }, [current]);

  const handleSave = () => {
    const val = parseInt(inputValue) || 0;
    onUpdate(val);
    setIsEditing(false);
  };

  const addSteps = (amount: number) => {
    onUpdate(current + amount);
  };

  const percentage = Math.min(100, (current / goal) * 100);
  
  // Estimates
  const caloriesBurned = Math.round(current * 0.04);
  const distanceKm = (current * 0.0008).toFixed(2);
  const activeMinutes = Math.round(current / 100); // Rough estimate 100 steps/min

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full transition-colors">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
            <Footprints size={24} className="fill-orange-600 dark:fill-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Daily Steps</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Goal: {goal.toLocaleString()}</p>
          </div>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Edit2 size={18} />
          </button>
        ) : (
          <button onClick={handleSave} className="p-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <Check size={18} />
          </button>
        )}
      </div>

      {/* Main Counter & Progress */}
      <div className="mb-8 text-center">
        {isEditing ? (
          <input 
            type="number" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
            className="text-5xl font-bold text-slate-900 dark:text-white w-full text-center border-b-2 border-orange-200 dark:border-orange-800 focus:border-orange-500 outline-none bg-transparent py-2"
          />
        ) : (
          <div className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
            {current.toLocaleString()}
          </div>
        )}
        
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-center border border-slate-100 dark:border-slate-700">
          <div className="text-orange-500 mb-1 flex justify-center"><Flame size={16} /></div>
          <div className="font-bold text-slate-800 dark:text-white text-sm">{caloriesBurned}</div>
          <div className="text-[10px] text-slate-400 uppercase font-medium">Kcal</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-center border border-slate-100 dark:border-slate-700">
          <div className="text-blue-500 mb-1 flex justify-center"><MapPin size={16} /></div>
          <div className="font-bold text-slate-800 dark:text-white text-sm">{distanceKm}</div>
          <div className="text-[10px] text-slate-400 uppercase font-medium">Km</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-center border border-slate-100 dark:border-slate-700">
          <div className="text-purple-500 mb-1 flex justify-center"><Timer size={16} /></div>
          <div className="font-bold text-slate-800 dark:text-white text-sm">{activeMinutes}</div>
          <div className="text-[10px] text-slate-400 uppercase font-medium">Mins</div>
        </div>
      </div>

      {/* Quick Add Actions */}
      <div className="mt-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase mb-3 ml-1">Quick Add</p>
        <div className="grid grid-cols-3 gap-3">
          {[250, 500, 1000].map((amount) => (
            <button
              key={amount}
              onClick={() => addSteps(amount)}
              className="py-2 px-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all flex items-center justify-center gap-1 active:scale-95"
            >
              <Plus size={12} /> {amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
