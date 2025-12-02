
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { HistoryData } from '../types';

interface HistoryChartProps {
  data: HistoryData[];
  goalCalories: number;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ data, goalCalories }) => {
  const [viewMode, setViewMode] = useState<'calories' | 'macros'>('calories');

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-[400px] flex flex-col transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Weekly Overview</h3>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('calories')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'calories' 
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Calories
          </button>
          <button
            onClick={() => setViewMode('macros')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewMode === 'macros' 
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Macros
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: '#1e293b',
                color: '#f8fafc'
              }}
            />
            {viewMode === 'calories' ? (
              <Bar 
                dataKey="calories" 
                name="Calories"
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                barSize={40}
              />
            ) : (
              <>
                <Bar dataKey="protein" name="Protein (g)" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="carbs" name="Carbs (g)" stackId="a" fill="#f59e0b" />
                <Bar dataKey="fat" name="Fat (g)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
