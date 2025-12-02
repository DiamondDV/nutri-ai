
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Menu, X, Trash2, ChevronRight, Activity, Settings, LogOut, Flame, Sparkles, History as HistoryIcon, Droplet, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Footprints, Moon, Sun, ChefHat } from 'lucide-react';
import { RadialChart } from './components/RadialChart';
import { FoodLogger } from './components/FoodLogger';
import { AICoach } from './components/AICoach';
import { LoginScreen } from './components/LoginScreen';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { WaterTracker } from './components/WaterTracker';
import { StepsTracker } from './components/StepsTracker';
import { HistoryChart } from './components/HistoryChart';
import { MealSuggester } from './components/MealSuggester';
import { getTodayLog, saveFoodItem, deleteFoodItem, getCurrentUserSession, setCurrentUserSession, logoutUser, updateUserGoals, saveDailyAnalysis, completeOnboarding, updateWaterIntake, updateSteps, getWeeklyHistory } from './services/storage';
import { generateDailySummary } from './services/geminiService';
import { DailyLog, FoodItem, UserProfile, UserStats, UserGoals, HistoryData, DailyAnalysisResult, MacroNutrients } from './types';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'coach' | 'steps' | 'suggestions'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: '', items: [], water: 0, steps: 0 });
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  
  // Set default to false (Light Mode) explicitly
  const [darkMode, setDarkMode] = useState(false);

  // Initial Load & Auth Check
  useEffect(() => {
    const profile = getCurrentUserSession();
    if (profile) {
      setUser(profile);
      refreshData();
    }
    
    // Default to Light Mode. Only check if user had a saved preference (optional).
    // For now, we respect the "Keep light mode as default" request by not auto-detecting system preference.
  }, []);

  // Toggle Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Recalculate totals whenever log changes
  useEffect(() => {
    const newTotals = todayLog.items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    setTotals(newTotals);
  }, [todayLog]);

  const refreshData = () => {
    const log = getTodayLog();
    setTodayLog(log);
    const history = getWeeklyHistory();
    setHistoryData(history);
  };

  const handleLogin = (profile: UserProfile) => {
    setCurrentUserSession(profile);
    setUser(profile);
    refreshData();
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setTodayLog({ date: '', items: [], water: 0, steps: 0 });
  };

  const handleOnboardingComplete = (stats: UserStats, goals: UserGoals) => {
    const updatedUser = completeOnboarding(stats, goals);
    if (updatedUser) {
      setUser(updatedUser);
    }
  };

  const handleAddFood = (item: FoodItem) => {
    saveFoodItem(item);
    refreshData();
    if(activeTab === 'coach' || activeTab === 'history') setActiveTab('dashboard');
  };

  const handleWaterAdd = (amount: number) => {
    updateWaterIntake(amount);
    refreshData();
  };

  const handleStepsUpdate = (steps: number) => {
    updateSteps(steps);
    refreshData();
  }

  const handleDeleteFood = (id: string) => {
    deleteFoodItem(id);
    refreshData();
  };

  const handleUpdateGoals = (newGoals: any) => {
    const updatedUser = updateUserGoals(newGoals);
    if (updatedUser) {
      setUser(updatedUser);
      setIsSettingsOpen(false);
    }
  };

  const handleDailyAnalysis = async () => {
    if (!user) return;
    setIsGeneratingFeedback(true);
    const feedbackStr = await generateDailySummary(todayLog, user.goals);
    saveDailyAnalysis(feedbackStr);
    refreshData();
    setIsGeneratingFeedback(false);
  };
  
  // Helper to parse analysis safely
  const getParsedAnalysis = (): DailyAnalysisResult | null => {
    if (!todayLog.dailyAnalysis) return null;
    try {
      return JSON.parse(todayLog.dailyAnalysis);
    } catch (e) {
      return null;
    }
  };
  
  // Calculate remaining macros for the Meal Suggester
  const getRemainingMacros = (): MacroNutrients => {
    if (!user) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      calories: user.goals.calories - totals.calories,
      protein: user.goals.protein - totals.protein,
      carbs: user.goals.carbs - totals.carbs,
      fat: user.goals.fat - totals.fat,
    };
  };

  const analysisResult = getParsedAnalysis();

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show Onboarding if user exists but hasn't completed it
  if (!user.onboardingCompleted) {
    // @ts-ignore
    return <OnboardingModal onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300`}>
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          currentGoals={user.goals} 
          onSave={handleUpdateGoals} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-screen sticky top-0 z-30 transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
              <Activity size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">NutriVision</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'suggestions' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ChefHat size={20} />
            Meal Ideas
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'steps' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Footprints size={20} />
            Steps
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'history' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HistoryIcon size={20} />
            History
          </button>
          <button
            onClick={() => setActiveTab('coach')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'coach' 
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare size={20} />
            AI Coach
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
          <div className="bg-slate-900 dark:bg-black rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                 <Flame className="text-orange-500" size={18} />
                 <p className="text-xs text-slate-400">Streak</p>
               </div>
               <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Toggle Theme"
               >
                 {darkMode ? <Sun size={14} /> : <Moon size={14} />}
               </button>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">{user.streak}</span>
              <span className="text-sm text-slate-400 mb-1">days</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-600" />
              <div className="text-sm">
                <p className="font-medium text-slate-800 dark:text-slate-200">{user.name.split(' ')[0]}</p>
                <button onClick={handleLogout} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center gap-1">
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Activity size={18} />
          </div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">NutriVision</h1>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-600 dark:text-slate-400">
             {darkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-400">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-20 px-4 flex flex-col">
          <nav className="space-y-4 flex-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium ${
                activeTab === 'dashboard' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutDashboard size={24} /> Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('suggestions'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium ${
                activeTab === 'suggestions' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ChefHat size={24} /> Meal Ideas
            </button>
            <button
              onClick={() => { setActiveTab('steps'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium ${
                activeTab === 'steps' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Footprints size={24} /> Steps
            </button>
            <button
              onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium ${
                activeTab === 'history' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <HistoryIcon size={24} /> History
            </button>
            <button
              onClick={() => { setActiveTab('coach'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium ${
                activeTab === 'coach' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MessageSquare size={24} /> AI Coach
            </button>
            <button
              onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Settings size={24} /> Settings
            </button>
          </nav>
          <div className="p-6 border-t border-slate-100 dark:border-slate-800">
             <button onClick={handleLogout} className="w-full py-4 text-red-500 font-medium flex items-center justify-center gap-2">
                <LogOut size={20} /> Sign Out
             </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Today's Overview</h2>
                <p className="text-slate-500 dark:text-slate-400">Track your meals and stay on target.</p>
              </div>
              <div className="hidden md:block">
                 <span className="text-sm text-slate-400 dark:text-slate-500">Welcome back, {user.name}</span>
              </div>
            </div>

            {/* FIXED LAYOUT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Macro Cards - Takes 8 cols on large screens */}
              <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center transition-colors">
                    <RadialChart 
                      current={totals.calories} 
                      total={user.goals.calories} 
                      label="Calories" 
                      color="#059669" 
                      unit="kcal"
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-center transition-colors">
                     <RadialChart current={totals.protein} total={user.goals.protein} label="Protein" color="#3b82f6" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-center transition-colors">
                     <RadialChart current={totals.carbs} total={user.goals.carbs} label="Carbs" color="#f59e0b" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-center transition-colors">
                     <RadialChart current={totals.fat} total={user.goals.fat} label="Fat" color="#ef4444" />
                  </div>
              </div>

              {/* Stack Steps and Water on the right side for better spacing */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1 lg:col-span-2 h-full">
                     <StepsTracker 
                       current={todayLog.steps || 0} 
                       goal={user.goals.steps || 10000} 
                       onUpdate={handleStepsUpdate} 
                     />
                 </div>
                 <div className="col-span-2 sm:col-span-1 lg:col-span-2 h-full">
                     <WaterTracker current={todayLog.water || 0} onAdd={handleWaterAdd} />
                 </div>
              </div>
            </div>

            {/* Daily Feedback Section */}
            {todayLog.items.length > 0 && (
              <div className={`rounded-2xl shadow-sm border transition-all ${
                analysisResult 
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                  : 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-blue-100 dark:border-blue-900/50 p-6'
              }`}>
                 {!analysisResult ? (
                    // Default State (Pre-analysis)
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                           <Sparkles size={20} />
                         </div>
                         <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Daily Analysis</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Get personalized feedback on your day.</p>
                         </div>
                       </div>
                       <button 
                        onClick={handleDailyAnalysis}
                        disabled={isGeneratingFeedback}
                        className="text-xs bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full font-semibold shadow-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 border border-blue-100 dark:border-blue-800 flex items-center gap-2"
                       >
                         {isGeneratingFeedback ? <><div className="w-3 h-3 rounded-full border-2 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin"></div> Analyzing...</> : 'Generate Report'}
                       </button>
                    </div>
                 ) : (
                    // Structured Analysis Result
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{analysisResult.headline}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">AI Daily Report</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className={`text-2xl font-bold ${analysisResult.score >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
                                    {analysisResult.score}/10
                                </div>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Score</span>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <CheckCircle2 size={16} /> What Went Well
                                </h4>
                                <ul className="space-y-2">
                                    {analysisResult.positives.map((item, i) => (
                                        <li key={i} className="text-sm text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <AlertTriangle size={16} /> Improvements
                                </h4>
                                <ul className="space-y-2">
                                    {analysisResult.improvements.map((item, i) => (
                                        <li key={i} className="text-sm text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-100/50 dark:border-amber-800/50">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Lightbulb size={16} /> Tip for Tomorrow
                                </h4>
                                <div className="text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-3 rounded-lg border border-blue-100/50 dark:border-blue-800/50 italic">
                                    "{analysisResult.tip}"
                                </div>
                                <div className="pt-2 text-right">
                                   <button 
                                      onClick={handleDailyAnalysis}
                                      className="text-xs text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 underline"
                                   >
                                      Refresh Analysis
                                   </button>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Log Food + History */}
              <div className="lg:col-span-2 space-y-8">
                <FoodLogger onAddFood={handleAddFood} />
                
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                    <span>Recent Entries</span>
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{todayLog.items.length} items</span>
                  </h3>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                    {todayLog.items.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <p>No meals logged today yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {todayLog.items.slice().reverse().map((item) => (
                          <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-4">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                                    {item.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-semibold text-slate-800 dark:text-white">{item.name}</h4>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="capitalize">{item.mealType}</span>
                                    <span>•</span>
                                    <span>{item.servingSize}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                  <p className="font-bold text-slate-700 dark:text-slate-200">{Math.round(item.calories)} kcal</p>
                                  <p className="text-xs text-slate-400">
                                    P:{Math.round(item.protein)} C:{Math.round(item.carbs)} F:{Math.round(item.fat)}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteFood(item.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            
                            {item.healthTips && (
                              <div className="ml-16 bg-emerald-50/50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100/50 dark:border-emerald-800/30">
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 italic flex gap-1">
                                  <span className="not-italic">💡</span> {item.healthTips}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Coach Teaser or Tips */}
              <div className="space-y-6">
                <div className="bg-emerald-900 dark:bg-emerald-950 text-emerald-50 rounded-2xl p-6 relative overflow-hidden group cursor-pointer border border-transparent dark:border-emerald-900" onClick={() => setActiveTab('suggestions')}>
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2">What to eat next?</h3>
                    <p className="text-emerald-200 text-sm mb-4">Get personalized meal suggestions based on your remaining macros.</p>
                    <div 
                      className="bg-white dark:bg-emerald-800 dark:text-emerald-100 text-emerald-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
                    >
                      Suggest Meals <ChevronRight size={16} />
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-800 dark:bg-emerald-700 rounded-full opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-emerald-500 dark:bg-emerald-600 rounded-full opacity-20 blur-xl"></div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 dark:text-white">Macro Breakdown</h3>
                   </div>
                   <div className="space-y-4">
                      {['Protein', 'Carbs', 'Fat'].map((macro) => {
                          const key = macro.toLowerCase() as 'protein' | 'carbs' | 'fat';
                          const color = key === 'protein' ? 'bg-blue-500' : key === 'carbs' ? 'bg-amber-500' : 'bg-red-500';
                          return (
                            <div key={macro}>
                                <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600 dark:text-slate-300">{macro}</span>
                                <span className="font-medium text-slate-900 dark:text-white">{Math.round(totals[key])} / {user.goals[key]}g</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, (totals[key]/user.goals[key])*100)}%` }}></div>
                                </div>
                            </div>
                          );
                      })}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
           <MealSuggester remainingMacros={getRemainingMacros()} />
        )}

        {activeTab === 'steps' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Steps Tracker</h2>
                <p className="text-slate-500 dark:text-slate-400">Keep moving to reach your daily activity goal.</p>
             </div>
             
             <div className="h-[420px]">
                <StepsTracker 
                    current={todayLog.steps || 0} 
                    goal={user.goals.steps || 10000} 
                    onUpdate={handleStepsUpdate} 
                 />
             </div>
          </div>
        )}

        {activeTab === 'history' && (
             <div className="space-y-6 animate-in fade-in duration-500">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your History</h2>
                    <p className="text-slate-500 dark:text-slate-400">Track your consistency over the last 7 days.</p>
                </div>
                <HistoryChart data={historyData} goalCalories={user.goals.calories} />
                
                <div className="grid md:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Consistency Score</h3>
                        <div className="flex items-center gap-4">
                             <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{user.streak}</div>
                             <p className="text-slate-500 dark:text-slate-400 text-sm">Days streak maintained. <br/> Keep it up!</p>
                        </div>
                     </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Weekly Average</h3>
                        <div className="text-sm space-y-2">
                             <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-600 dark:text-slate-300">
                                 <span className="text-slate-500 dark:text-slate-400">Avg Calories</span>
                                 <span className="font-bold">{Math.round(historyData.reduce((a,b) => a + b.calories, 0) / (historyData.length || 1))} kcal</span>
                             </div>
                             <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-600 dark:text-slate-300">
                                 <span className="text-slate-500 dark:text-slate-400">Avg Protein</span>
                                 <span className="font-bold">{Math.round(historyData.reduce((a,b) => a + b.protein, 0) / (historyData.length || 1))} g</span>
                             </div>
                        </div>
                     </div>
                </div>
             </div>
        )}

        {activeTab === 'coach' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
             <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Nutrition Coach</h2>
              <p className="text-slate-500 dark:text-slate-400">Get personalized feedback based on your logs.</p>
            </div>
            <AICoach todayLog={todayLog} initialHistory={user.chatHistory} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
