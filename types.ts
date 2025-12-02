
export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserGoals extends MacroNutrients {
  steps: number;
}

export interface FoodItem extends MacroNutrients {
  id: string;
  name: string;
  servingSize: string;
  timestamp: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string; // Optional base64 or URL
  healthTips?: string; // Captured from AI analysis
}

export interface DailyAnalysisResult {
  score: number; // 1-10
  headline: string;
  positives: string[];
  improvements: string[];
  tip: string;
}

export interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timeToCook: string;
  imageUrl?: string;
}

export interface RecipeIngredient {
  item: string;
  amount: string;
}

export interface Recipe {
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tips: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  items: FoodItem[];
  water: number; // in ml
  steps: number;
  dailyAnalysis?: string; // AI Summary of the day (JSON stringified DailyAnalysisResult)
}

export interface UserStats {
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  goal: 'lose' | 'maintain' | 'gain';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  email: string; // Used as ID
  avatar: string;
  streak: number;
  lastLoginDate: string;
  goals: UserGoals;
  stats?: UserStats;
  onboardingCompleted: boolean;
  chatHistory: ChatMessage[];
}

export interface HistoryData {
  date: string; // "Mon", "Tue"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
