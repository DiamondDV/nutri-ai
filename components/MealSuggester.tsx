
import React, { useState } from 'react';
import { ChefHat, Loader2, Clock, Flame, ArrowRight, Utensils, Leaf } from 'lucide-react';
import { getMealSuggestions, generateFullRecipe } from '../services/geminiService';
import { MacroNutrients, MealSuggestion, Recipe } from '../types';
import { RecipeView } from './RecipeView';

interface MealSuggesterProps {
  remainingMacros: MacroNutrients;
}

export const MealSuggester: React.FC<MealSuggesterProps> = ({ remainingMacros }) => {
  const [mealType, setMealType] = useState<string>('dinner');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Recipe View State
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      // Modify meal type if veg mode is on
      const typeQuery = isVegetarian ? `Vegetarian ${mealType}` : mealType;
      const results = await getMealSuggestions(remainingMacros, typeQuery);
      
      // Augment with Image URLs via Pollinations.ai (since we don't have a real image gen backend)
      const resultsWithImages = results.map(meal => ({
        ...meal,
        imageUrl: `https://image.pollinations.ai/prompt/delicious ${encodeURIComponent(meal.name)} professional food photography lighting?width=400&height=300&nologo=true`
      }));

      setSuggestions(resultsWithImages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryThis = async (mealName: string) => {
    setIsGeneratingRecipe(true);
    try {
      const recipe = await generateFullRecipe(mealName);
      setSelectedRecipe(recipe);
    } catch (e) {
      console.error(e);
      alert("Failed to generate recipe details. Please try again.");
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {selectedRecipe && (
        <RecipeView recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}

      {isGeneratingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex flex-col items-center shadow-2xl">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <p className="font-semibold text-slate-800 dark:text-white">Chef AI is writing your recipe...</p>
           </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ChefHat className="text-emerald-600" /> Meal Suggestions
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Get AI-powered recipe ideas that fit perfectly into your remaining daily goals.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-6">
          
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="w-full md:w-auto">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Meal Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
                    <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`py-2 px-3 text-sm rounded-lg capitalize border transition-all font-medium ${
                        mealType === t
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                    >
                    {t}
                    </button>
                ))}
                </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl border border-slate-100 dark:border-slate-600">
                <button
                    onClick={() => setIsVegetarian(!isVegetarian)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isVegetarian 
                         ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shadow-sm'
                         : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600'
                    }`}
                >
                    <Leaf size={16} className={isVegetarian ? 'fill-emerald-700 dark:fill-emerald-300' : ''} /> 
                    Vegetarian Only
                </button>
            </div>
          </div>
          
          <button
            onClick={handleGetSuggestions}
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><Utensils size={18} /> Suggest Meals</>}
          </button>
        </div>

        {/* Remaining Macros Context */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">Budget:</span>
          <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" /> {Math.max(0, remainingMacros.calories)} kcal</span>
          <span>•</span>
          <span className="flex items-center gap-1">Protein: {Math.max(0, remainingMacros.protein)}g</span>
          <span>•</span>
          <span className="flex items-center gap-1">Carbs: {Math.max(0, remainingMacros.carbs)}g</span>
          <span>•</span>
          <span className="flex items-center gap-1">Fat: {Math.max(0, remainingMacros.fat)}g</span>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {suggestions.map((meal, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
              {meal.imageUrl && (
                <div className="h-40 overflow-hidden relative">
                    <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md font-bold">
                        {meal.calories} kcal
                    </div>
                </div>
              )}
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-2">{meal.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 flex-1 line-clamp-3">{meal.description}</p>
                
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                    <div className="flex items-center gap-1">
                      <Clock size={14} /> {meal.timeToCook}
                    </div>
                    <div className="flex gap-2">
                        <span>P: {meal.protein}g</span>
                        <span>C: {meal.carbs}g</span>
                        <span>F: {meal.fat}g</span>
                    </div>
                </div>

                <button 
                  onClick={() => handleTryThis(meal.name)}
                  className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                >
                    Try this <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
