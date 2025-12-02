
import React, { useState, useRef, useEffect } from 'react';
import { X, ChefHat, CheckCircle2, Circle, Clock, Flame, Send, Camera, Image as ImageIcon } from 'lucide-react';
import { Recipe, ChatMessage } from '../types';
import { getCookingAssistantResponse } from '../services/geminiService';

interface RecipeViewProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeView: React.FC<RecipeViewProps> = ({ recipe, onClose }) => {
  const [activeTab, setActiveTab] = useState<'recipe' | 'chat'>('recipe');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: `I'm your AI Sous Chef! I can help you cook **${recipe.name}**. Ask me if you're stuck, or show me a photo of your pan!`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const toggleIngredient = (idx: number) => {
    const key = idx.toString();
    const newSet = new Set(checkedIngredients);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setCheckedIngredients(newSet);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input + (selectedImage ? " [Image Uploaded]" : ""),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const response = await getCookingAssistantResponse(recipe.name, input, selectedImage || undefined);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
      setSelectedImage(null); // Clear image after sending
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl h-[80vh] shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white truncate pr-4">{recipe.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('recipe')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'recipe' 
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Recipe Details
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat' 
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            AI Chef Assistant
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          {activeTab === 'recipe' ? (
            <div className="p-6 space-y-6">
              
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-2">
                  <ChefHat size={18} /> Chef's Tip
                </h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 italic">
                  {recipe.tips}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Ingredients</h3>
                <div className="space-y-2">
                  {recipe.ingredients.map((ing, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => toggleIngredient(idx)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        checkedIngredients.has(idx.toString())
                          ? 'bg-slate-100 dark:bg-slate-800 border-transparent opacity-60' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'
                      }`}
                    >
                      {checkedIngredients.has(idx.toString()) 
                        ? <CheckCircle2 className="text-emerald-500" size={20} />
                        : <Circle className="text-slate-300" size={20} />
                      }
                      <span className={`text-sm ${checkedIngredients.has(idx.toString()) ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        <span className="font-bold">{ing.amount}</span> {ing.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-3">Instructions</h3>
                <div className="space-y-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                  {recipe.instructions.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        {idx + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm pt-1 pl-4">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                   <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'model' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                        {msg.role === 'model' ? <ChefHat size={16} /> : <div className="text-xs font-bold">You</div>}
                      </div>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'model' 
                          ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm' 
                          : 'bg-emerald-600 text-white rounded-tr-none'
                      }`}>
                        {msg.text}
                      </div>
                   </div>
                ))}
              </div>
              
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                {selectedImage && (
                  <div className="mb-2 relative inline-block">
                    <img src={selectedImage} alt="Upload" className="h-16 rounded-lg border border-slate-200 dark:border-slate-700" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                   >
                     <Camera size={20} />
                   </button>
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                   
                   <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask chef..."
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                   />
                   <button 
                    onClick={handleSend}
                    disabled={isSending || (!input && !selectedImage)}
                    className="p-2 bg-emerald-600 text-white rounded-full disabled:opacity-50"
                   >
                     <Send size={18} />
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
