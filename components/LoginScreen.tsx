
import React, { useState } from 'react';
import { Activity, Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/storage';

interface LoginScreenProps {
  onLogin: (userProfile: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Artificial delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      if (isLoginMode) {
        // Login Logic
        const user = loginUser(email, password);
        onLogin(user);
      } else {
        // Register Logic
        if (!name.trim()) throw new Error("Please enter your name");
        const user = registerUser(email, name, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 transition-colors">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none rotate-3">
              <Activity size={32} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isLoginMode ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isLoginMode ? "Enter your details to sign in." : "Start your health journey today."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field (Only for Signup) */}
          {!isLoginMode && (
             <div className="relative group animate-in slide-in-from-top-2 duration-300">
               <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
               <input
                 type="text"
                 required={!isLoginMode}
                 placeholder="Full Name"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
               />
             </div>
          )}

          {/* Email Field */}
          <div className="relative group">
            <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="relative group">
            <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input
              type="password"
              required
              minLength={4}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          
          {error && (
             <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
               <AlertCircle size={16} /> {error}
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLoginMode ? "Sign In" : "Sign Up"} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              {isLoginMode ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
