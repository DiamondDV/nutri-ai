
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Type, Loader2, AlertCircle, Plus, Image as ImageIcon, X, Sparkles, Search, Save } from 'lucide-react';
import { analyzeFoodImage, analyzeFoodText, searchFoodDatabase } from '../services/geminiService';
import { FoodItem } from '../types';

interface FoodLoggerProps {
  onAddFood: (item: FoodItem) => void;
}

export const FoodLogger: React.FC<FoodLoggerProps> = ({ onAddFood }) => {
  const [mode, setMode] = useState<'search' | 'describe' | 'image'>('search');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Omit<FoodItem, 'id' | 'timestamp' | 'mealType'> | null>(null);
  const [mealType, setMealType] = useState<FoodItem['mealType']>('breakfast');
  
  // Customization State
  const [editValues, setEditValues] = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save draft for description
  useEffect(() => {
    const savedDraft = localStorage.getItem('nutrivision_draft_text');
    if (savedDraft) setInputText(savedDraft);
  }, []);

  useEffect(() => {
    localStorage.setItem('nutrivision_draft_text', inputText);
  }, [inputText]);

  // Sync preview item to editable state
  useEffect(() => {
    if (previewItem) {
      setEditValues({
        name: previewItem.name,
        calories: previewItem.calories,
        protein: previewItem.protein,
        carbs: previewItem.carbs,
        fat: previewItem.fat,
        servingSize: previewItem.servingSize
      });
    }
  }, [previewItem]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText && !selectedImage && !searchQuery) return;
    
    setIsAnalyzing(true);
    setError(null);
    setPreviewItem(null);

    try {
      let result;
      if (mode === 'image' && selectedImage) {
        const base64Data = selectedImage.split(',')[1];
        result = await analyzeFoodImage(base64Data);
      } else if (mode === 'describe' && inputText) {
        result = await analyzeFoodText(inputText);
        // Clear draft after successful analysis
        setInputText('');
        localStorage.removeItem('nutrivision_draft_text');
      } else if (mode === 'search' && searchQuery) {
        result = await searchFoodDatabase(searchQuery);
        setSearchQuery('');
      } else {
        return; 
      }
      setPreviewItem(result);
    } catch (err) {
      setError("Could not analyze food. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (previewItem) {
      // Auto-generate image if none selected
      let finalImage = selectedImage;
      if (!finalImage) {
         const encodedName = encodeURIComponent(editValues.name);
         finalImage = `https://image.pollinations.ai/prompt/delicious ${encodedName} food photography lighting?width=200&height=200&nologo=true`;
      }

      const newItem: FoodItem = {
        ...previewItem,
        ...editValues, // Use edited values
        id: Date.now().toString(),
        timestamp: Date.now(),
        mealType,
        imageUrl: finalImage || undefined
      };
      onAddFood(newItem);
      // Reset
      setPreviewItem(null);
      setSelectedImage(null);
      setMode('search');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
        <h3 className="font-semibold text-slate-800 dark:text-white">Log Food</h3>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => { setMode('search'); setPreviewItem(null); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'search' 
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search size={14} /> Search
            </div>
          </button>
          <button
            onClick={() => { setMode('describe'); setPreviewItem(null); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'describe' 
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Type size={14} /> Describe
            </div>
          </button>
          <button
            onClick={() => { setMode('image'); setPreviewItem(null); }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'image' 
                 ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Camera size={14} /> Photo
            </div>
          </button>
        </div>
      </div>

      <div className="p-6">
        {!previewItem ? (
          <div className="space-y-4">
            
            {mode === 'search' && (
              <div className="space-y-3">
                 <div className="relative">
                   <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                   <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      placeholder="Search food (e.g., '1 large banana')"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white dark:placeholder-slate-500"
                   />
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">Quickly add common foods from our AI database.</p>
              </div>
            )}

            {mode === 'describe' && (
              <div className="space-y-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g., Grilled chicken salad with avocado and balsamic dressing..."
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none transition-all placeholder:text-slate-400 dark:text-white dark:placeholder-slate-500"
                />
                <div className="flex items-center gap-1 text-xs text-slate-400 justify-end">
                   <Save size={12} /> Draft auto-saved
                </div>
              </div>
            )}

            {mode === 'image' && (
              <div className="space-y-4">
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      selectedImage 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                 >
                    {selectedImage ? (
                      <div className="relative h-full w-full p-2">
                         <img src={selectedImage} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                         <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            className="absolute top-2 right-2 p-1 bg-white dark:bg-slate-800 rounded-full shadow-md text-slate-500 hover:text-red-500"
                         >
                            <X size={16} />
                         </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Click to upload or take photo</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                      capture="environment"
                    />
                 </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (mode === 'describe' && !inputText) || (mode === 'image' && !selectedImage) || (mode === 'search' && !searchQuery)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> {mode === 'search' ? 'Search Food' : 'Analyze Food'}
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-4">
              <div className="mb-4">
                  <label className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase mb-1 block">Food Name</label>
                  <input 
                    type="text" 
                    value={editValues.name}
                    onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                    className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
              </div>
              
              <div className="flex gap-4 mb-4">
                 <div className="flex-1">
                    <label className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase mb-1 block">Serving</label>
                    <input 
                      type="text" 
                      value={editValues.servingSize}
                      onChange={(e) => setEditValues({...editValues, servingSize: e.target.value})}
                      className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                 </div>
                 <div className="w-24">
                    <label className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase mb-1 block">Calories</label>
                    <input 
                      type="number" 
                      value={editValues.calories}
                      onChange={(e) => setEditValues({...editValues, calories: parseInt(e.target.value) || 0})}
                      className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-slate-800 dark:text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                 </div>
              </div>

              {/* Updated UI for Macros: Dark Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800 p-2 rounded-lg text-center shadow-sm">
                  <p className="text-xs text-slate-400 uppercase mb-1">Protein</p>
                  <input 
                      type="number" 
                      value={editValues.protein}
                      onChange={(e) => setEditValues({...editValues, protein: parseInt(e.target.value) || 0})}
                      className="w-full text-center text-xl font-bold text-white bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg text-center shadow-sm">
                  <p className="text-xs text-slate-400 uppercase mb-1">Carbs</p>
                  <input 
                      type="number" 
                      value={editValues.carbs}
                      onChange={(e) => setEditValues({...editValues, carbs: parseInt(e.target.value) || 0})}
                      className="w-full text-center text-xl font-bold text-white bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg text-center shadow-sm">
                  <p className="text-xs text-slate-400 uppercase mb-1">Fat</p>
                  <input 
                      type="number" 
                      value={editValues.fat}
                      onChange={(e) => setEditValues({...editValues, fat: parseInt(e.target.value) || 0})}
                      className="w-full text-center text-xl font-bold text-white bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
              </div>
              
               {/* @ts-ignore */}
              {previewItem['healthTips'] && (
                <div className="mt-3 text-xs text-emerald-800 dark:text-emerald-300 italic border-t border-emerald-100 dark:border-emerald-800 pt-2">
                   {/* @ts-ignore */}
                  💡 {previewItem['healthTips']}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Meal Type</label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`py-2 text-sm rounded-lg capitalize border transition-all ${
                      mealType === t 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewItem(null)}
                className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white rounded-xl font-semibold shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={20} /> Add to Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
