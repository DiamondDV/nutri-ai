
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface RadialChartProps {
  current: number;
  total: number;
  label: string;
  color: string;
  unit?: string;
}

export const RadialChart: React.FC<RadialChartProps> = ({ current, total, label, color, unit = 'g' }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const remaining = Math.max(0, 100 - percentage);
  
  const data = [
    { name: 'Current', value: percentage },
    { name: 'Remaining', value: remaining },
  ];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="h-24 w-24 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={40}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell key="current" fill={color} />
              <Cell key="remaining" fill="#e2e8f0" className="dark:fill-slate-700" />
              <Label
                value={`${Math.round(current)}`}
                position="center"
                className="fill-slate-700 dark:fill-white text-sm font-bold"
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-center">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{Math.round(total)}{unit}</p>
      </div>
    </div>
  );
};
