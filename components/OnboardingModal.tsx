
import React, { useState } from 'react';
import { ChevronRight, Ruler, Scale, User, Activity, Target } from 'lucide-react';
import { UserStats, MacroNutrients } from '../types';

interface OnboardingModalProps {
  onComplete: (stats: UserStats, calculatedGoals: MacroNutrients) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [stats, setStats] = useState<UserStats>({
    gender: 'male',
    age: 25,
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintain'
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else finishOnboarding();
  };

  const finishOnboarding = () => {
    // 1. Calculate BMR (Mifflin-St Jeor Equation)
    // Men: 10W + 6.25H - 5A + 5
    // Women: 10W + 6.25H - 5A - 161
    let bmr = (10 * stats.weight) + (6.25 * stats.height) - (5 * stats.age);
    bmr += stats.gender === 'male' ? 5 : -161;

    // 2. TDEE Multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      athlete: 1.9
    };
    const tdee = bmr * activityMultipliers[stats.activityLevel];

    // 3. Goal Adjustment
    let targetCalories = tdee;
    if (stats.goal === 'lose') targetCalories -= 500;
    else if (stats.goal === 'gain') targetCalories += 500;

    // 4. Calculate Macros (Rough estimates)
    // Protein: ~2g per kg of bodyweight
    const protein = stats.weight * 2; // 1g protein = 4 cal
    // Fat: ~0.8g per kg of bodyweight
    const fat = stats.weight * 0.9; // 1g fat = 9 cal
    
    const proteinCals = protein * 4;
    const fatCals = fat * 9;
    const remainingCals = Math.max(0, targetCalories - (proteinCals + fatCals));
    const carbs = remainingCals / 4;

    const calculatedGoals: MacroNutrients = {
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbs: Math.round(carbs)
    };

    onComplete(stats, calculatedGoals);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 transition-colors">
        
        {/* Progress Bar */}
        <div className="bg-slate-100 dark:bg-slate-700 h-2 w-full">
          <div 
            className="h-full bg-emerald-600 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Your body stats"}
              {step === 3 && "Activity & Goals"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Step {step} of 3</p>
          </div>

          <div className="min-h-[250px]">
            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['male', 'female'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => setStats({...stats, gender: g})}
                        className={`py-3 px-4 rounded-xl border-2 font-medium capitalize transition-all ${
                          stats.gender === g 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                            : 'border-slate-200 dark:border-slate-600 hover:border-emerald-200 dark:hover:border-emerald-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Age</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="number"
                      value={stats.age}
                      onChange={(e) => setStats({...stats, age: parseInt(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Measurements */}
            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Height (cm)</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="number"
                      value={stats.height}
                      onChange={(e) => setStats({...stats, height: parseInt(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input
                      type="number"
                      value={stats.weight}
                      onChange={(e) => setStats({...stats, weight: parseInt(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Lifestyle */}
            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Activity Level</label>
                  <div className="relative">
                     <Activity className="absolute left-3 top-3.5 text-slate-400 z-10" size={20} />
                     <select
                      value={stats.activityLevel}
                      onChange={(e) => setStats({...stats, activityLevel: e.target.value as any})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none text-slate-900 dark:text-white"
                    >
                      <option value="sedentary">Sedentary (Little to no exercise)</option>
                      <option value="light">Light (Exercise 1-3 days/week)</option>
                      <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
                      <option value="active">Active (Exercise 6-7 days/week)</option>
                      <option value="athlete">Athlete (Physical job or 2x training)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Goal</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'lose', label: 'Lose Fat' },
                      { val: 'maintain', label: 'Maintain' },
                      { val: 'gain', label: 'Build Muscle' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setStats({...stats, goal: opt.val as any})}
                        className={`py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          stats.goal === opt.val
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                            : 'border-slate-200 dark:border-slate-600 hover:border-emerald-200 dark:hover:border-emerald-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center gap-2"
            >
              {step === 3 ? 'Finish Setup' : 'Continue'} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
