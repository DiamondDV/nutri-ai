
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { getDietaryCoachResponse } from '../services/geminiService';
import { updateChatHistory } from '../services/storage';
import { ChatMessage, DailyLog } from '../types';

interface AICoachProps {
  todayLog: DailyLog;
  initialHistory?: ChatMessage[];
}

// Custom Markdown Renderer Component
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];

  const parseInline = (str: string) => {
    // Split by bold markers **text**
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const flushList = (keyPrefix: number) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="list-disc pl-5 mb-3 space-y-1 text-slate-700 dark:text-slate-300">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(index);
      return;
    }

    if (trimmed.startsWith('###')) {
      flushList(index);
      elements.push(
        <h3 key={index} className="font-bold text-lg mt-4 mb-2 text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-900/50 pb-1">
          {parseInline(trimmed.replace(/^###\s*/, ''))}
        </h3>
      );
    } else if (trimmed.startsWith('---')) {
      flushList(index);
      elements.push(<hr key={index} className="my-4 border-slate-200 dark:border-slate-700" />);
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      listBuffer.push(
        <li key={index}>
          {parseInline(trimmed.replace(/^[\*\-]\s*/, ''))}
        </li>
      );
    } else {
      flushList(index);
      elements.push(
        <p key={index} className="mb-2 last:mb-0 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    }
  });

  flushList(lines.length); // Final flush

  return <div className="text-sm">{elements}</div>;
};

export const AICoach: React.FC<AICoachProps> = ({ todayLog, initialHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory || [
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm your NutriVision coach. **Ask me anything** about your meals, nutrition goals, or health tips!",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persist history whenever messages change (debounce could be added for optimization)
  useEffect(() => {
    if (messages.length > 0) {
        updateChatHistory(messages);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context summary
      const context = todayLog.items.length > 0 
        ? todayLog.items.map(i => `- ${i.name} (${i.calories}kcal)`).join('\n')
        : "No food logged yet today.";
      
      const responseText = await getDietaryCoachResponse(context, userMsg.text);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-4 bg-emerald-600 text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        <h2 className="font-semibold">AI Nutrition Coach</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'model' 
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.role === 'model' 
                ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700' 
                : 'bg-emerald-600 text-white rounded-tr-none'
            }`}>
              {msg.role === 'model' ? (
                <MarkdownRenderer text={msg.text} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Bot size={18} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your diet..."
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
