
import { DailyLog, FoodItem, UserProfile, MacroNutrients, UserGoals, UserStats, HistoryData, ChatMessage } from '../types';

const STORAGE_KEYS = {
  LOGS: 'nutrivision_logs_',
  CURRENT_USER: 'nutrivision_current_user', // The active session
  USERS_DB: 'nutrivision_users_db' // The database of all registered users
};

const DEFAULT_GOALS: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  steps: 10000
};

// --- Auth & User Database Management ---

interface UserRecord {
  profile: UserProfile;
  password?: string; // Storing simple password for this demo
  created: number;
}

const getUsersDB = (): Record<string, UserRecord> => {
  const db = localStorage.getItem(STORAGE_KEYS.USERS_DB);
  return db ? JSON.parse(db) : {};
};

const saveUsersDB = (db: Record<string, UserRecord>) => {
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
};

export const checkUserExists = (email: string): boolean => {
  const db = getUsersDB();
  return !!db[email];
};

export const registerUser = (email: string, name: string, password?: string): UserProfile => {
  const db = getUsersDB();
  
  if (db[email]) {
    throw new Error("User already exists");
  }
  
  // Use https://ui-avatars.com for a nice default avatar
  const newProfile: UserProfile = {
    name,
    email,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=059669&color=fff`,
    streak: 1,
    lastLoginDate: new Date().toISOString().split('T')[0],
    goals: DEFAULT_GOALS,
    onboardingCompleted: false,
    chatHistory: [
      {
        id: 'welcome',
        role: 'model',
        text: `Hi ${name.split(' ')[0]}! I'm your NutriVision coach. **Ask me anything** about your meals, nutrition goals, or health tips!`,
        timestamp: Date.now()
      }
    ]
  };

  db[email] = {
    profile: newProfile,
    password: password, // In a real app, this would be hashed!
    created: Date.now()
  };

  saveUsersDB(db);
  return newProfile;
};

export const loginUser = (email: string, password?: string): UserProfile => {
  const db = getUsersDB();
  const userRecord = db[email];

  if (!userRecord) {
    throw new Error("User not found");
  }

  // Simple password check for demo purposes
  if (password && userRecord.password && userRecord.password !== password) {
    throw new Error("Incorrect password");
  }

  // Update streak logic upon login
  const today = new Date().toISOString().split('T')[0];
  const profile = userRecord.profile;

  if (profile.lastLoginDate !== today) {
    const lastLogin = new Date(profile.lastLoginDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if last login was yesterday (using simple string comparison of dates for robustness)
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Normalize logic
    const diffTime = Math.abs(new Date(today).getTime() - new Date(profile.lastLoginDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (profile.lastLoginDate === yesterdayStr || diffDays === 1) {
      profile.streak += 1;
    } else if (diffDays > 1) {
      // Reset streak if missed a day
      profile.streak = 1;
    }
    
    profile.lastLoginDate = today;
    
    // Save updated profile back to DB
    db[email].profile = profile;
    saveUsersDB(db);
  }

  return profile;
};

// --- Session Management ---

export const setCurrentUserSession = (user: UserProfile) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const getCurrentUserSession = (): UserProfile | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const completeOnboarding = (stats: UserStats, calculatedGoals: MacroNutrients): UserProfile | null => {
  const currentUser = getCurrentUserSession();
  if (!currentUser) return null;

  currentUser.stats = stats;
  // Merge calculated macros with default steps
  currentUser.goals = { ...currentUser.goals, ...calculatedGoals };
  currentUser.onboardingCompleted = true;

  // Update Session
  setCurrentUserSession(currentUser);

  // Update Database
  const db = getUsersDB();
  if (db[currentUser.email]) {
    db[currentUser.email].profile = currentUser;
    saveUsersDB(db);
  }

  return currentUser;
};

export const updateUserGoals = (goals: UserGoals): UserProfile | null => {
  const currentUser = getCurrentUserSession();
  if (currentUser) {
    currentUser.goals = goals;
    
    // Update Session
    setCurrentUserSession(currentUser);
    
    // Update Database
    const db = getUsersDB();
    if (db[currentUser.email]) {
      db[currentUser.email].profile = currentUser;
      saveUsersDB(db);
    }
    
    return currentUser;
  }
  return null;
};

export const updateChatHistory = (messages: ChatMessage[]): void => {
  const currentUser = getCurrentUserSession();
  if (currentUser) {
    currentUser.chatHistory = messages;
    setCurrentUserSession(currentUser);

    const db = getUsersDB();
    if (db[currentUser.email]) {
      db[currentUser.email].profile = currentUser;
      saveUsersDB(db);
    }
  }
}

// --- Logs Management ---

const getUserLogKey = () => {
  const user = getCurrentUserSession();
  return user ? `${STORAGE_KEYS.LOGS}${user.email}` : null;
};

export const getLogs = (): Record<string, DailyLog> => {
  const key = getUserLogKey();
  if (!key) return {};
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to parse logs", e);
    return {};
  }
};

export const getTodayLog = (): DailyLog => {
  const today = new Date().toISOString().split('T')[0];
  const logs = getLogs();
  return logs[today] || { date: today, items: [], water: 0, steps: 0 };
};

export const saveFoodItem = (item: FoodItem): DailyLog => {
  const key = getUserLogKey();
  if (!key) throw new Error("No user logged in");

  const logs = getLogs();
  const today = new Date().toISOString().split('T')[0];
  
  if (!logs[today]) {
    logs[today] = { date: today, items: [], water: 0, steps: 0 };
  }
  
  logs[today].items.push(item);
  localStorage.setItem(key, JSON.stringify(logs));
  return logs[today];
};

export const updateWaterIntake = (amount: number): DailyLog => {
    const key = getUserLogKey();
    if (!key) throw new Error("No user logged in");
  
    const logs = getLogs();
    const today = new Date().toISOString().split('T')[0];
    
    if (!logs[today]) {
      logs[today] = { date: today, items: [], water: 0, steps: 0 };
    }
    
    logs[today].water = Math.max(0, (logs[today].water || 0) + amount);
    localStorage.setItem(key, JSON.stringify(logs));
    return logs[today];
};

export const updateSteps = (amount: number): DailyLog => {
    const key = getUserLogKey();
    if (!key) throw new Error("No user logged in");
  
    const logs = getLogs();
    const today = new Date().toISOString().split('T')[0];
    
    if (!logs[today]) {
      logs[today] = { date: today, items: [], water: 0, steps: 0 };
    }
    
    logs[today].steps = Math.max(0, amount); // Set directly, don't accumulate
    localStorage.setItem(key, JSON.stringify(logs));
    return logs[today];
};

export const deleteFoodItem = (itemId: string): DailyLog => {
  const key = getUserLogKey();
  if (!key) throw new Error("No user logged in");

  const logs = getLogs();
  const today = new Date().toISOString().split('T')[0];
  
  if (logs[today]) {
    logs[today].items = logs[today].items.filter(i => i.id !== itemId);
    localStorage.setItem(key, JSON.stringify(logs));
    return logs[today];
  }
  return { date: today, items: [], water: 0, steps: 0 };
};

export const saveDailyAnalysis = (analysis: string): void => {
  const key = getUserLogKey();
  if (!key) return;

  const logs = getLogs();
  const today = new Date().toISOString().split('T')[0];

  if (logs[today]) {
    logs[today].dailyAnalysis = analysis;
    localStorage.setItem(key, JSON.stringify(logs));
  }
};

export const getWeeklyHistory = (): HistoryData[] => {
    const logs = getLogs();
    const history: HistoryData[] = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const items = logs[dateStr]?.items || [];
        
        const stats = items.reduce<MacroNutrients>((acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fat: acc.fat + item.fat
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        history.push({
            date: dayName,
            ...stats
        });
    }
    return history;
};
