import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, DailyLog, MacroNutrients, DailyAnalysisResult, MealSuggestion, Recipe } from '../types';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

// Schema for structured food data extraction
const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A concise name of the food item" },
    calories: { type: Type.NUMBER, description: "Estimated calories" },
    protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
    carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
    fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
    servingSize: { type: Type.STRING, description: "Estimated serving size (e.g., '1 cup', '200g')" },
    confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
    healthTips: { type: Type.STRING, description: "A short, distinct, scientific health fact or tip about this specific food." }
  },
  required: ["name", "calories", "protein", "carbs", "fat", "servingSize", "healthTips"]
};

// Schema for daily summary
const dailySummarySchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Health score from 1-10 based on goal adherence" },
    headline: { type: Type.STRING, description: "A catchy 3-5 word summary of the day" },
    positives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2 things done well" },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 2 areas to improve" },
    tip: { type: Type.STRING, description: "One actionable tip for tomorrow" }
  },
  required: ["score", "headline", "positives", "improvements", "tip"]
};

// Schema for meal suggestions
const mealSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "Brief description of ingredients" },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          timeToCook: { type: Type.STRING, description: "e.g. '15 mins'" }
        },
        required: ["name", "description", "calories", "protein", "carbs", "fat", "timeToCook"]
      }
    }
  },
  required: ["suggestions"]
};

// Schema for full recipe generation
const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          amount: { type: Type.STRING },
        },
        required: ["item", "amount"],
      },
    },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    tips: { type: Type.STRING, description: "A chef's secret tip for this recipe." },
  },
  required: ["name", "ingredients", "instructions", "tips"],
};

export const analyzeFoodImage = async (base64Image: string): Promise<Omit<FoodItem, 'id' | 'timestamp' | 'mealType'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Analyze this image and identify the main food item. Estimate nutritional values with high precision. If there are multiple items, sum them up."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
        systemInstruction: "You are an expert nutritionist. Analyze the food in the image. Be precise with portions. If the portion looks large, adjust calories accordingly. Provide values for the *entire* visible portion."
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};

export const analyzeFoodText = async (description: string): Promise<Omit<FoodItem, 'id' | 'timestamp' | 'mealType'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this food description: "${description}". Estimate nutritional values.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
        systemInstruction: "You are an expert nutritionist. Provide nutritional estimates for the described food. If quantity isn't specified, assume a standard medium serving."
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw new Error("Failed to analyze text. Please try again.");
  }
};

export const searchFoodDatabase = async (query: string): Promise<Omit<FoodItem, 'id' | 'timestamp' | 'mealType'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for standard nutritional data for: "${query}". Return the most common serving size.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: foodAnalysisSchema,
        systemInstruction: "You are a nutrition database. Return accurate standard values for the queried food item. Do not hallucinate. If vague, pick the most common variation."
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("Failed to search food.");
  }
};

export const getDietaryCoachResponse = async (history: string, userQuery: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User Context (Today's Log):\n${history}\n\nUser Question: ${userQuery}`,
      config: {
        systemInstruction: "You are NutriVision, a friendly, encouraging, and knowledgeable nutrition coach. Keep answers concise, actionable, and scientifically accurate. Use emojis occasionally to be friendly."
      }
    });

    return response.text || "I'm having trouble thinking of a response right now.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I couldn't connect to the nutrition database right now.";
  }
};

export const generateDailySummary = async (log: DailyLog, goals: MacroNutrients): Promise<string> => {
  try {
    const itemsList = log.items.map(i => `- ${i.name}: ${i.calories}kcal, ${i.protein}g protein, ${i.carbs}g carbs, ${i.fat}g fat`).join('\n');
    
    const prompt = `
      Analyze this daily food log against goals:
      Goals: ${goals.calories} kcal, ${goals.protein}g P, ${goals.carbs}g C, ${goals.fat}g F.
      
      Log:
      ${itemsList}
      Water: ${log.water}ml
      
      Provide a structured summary.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dailySummarySchema,
        systemInstruction: "You are a supportive nutrition coach. Analyze the data strictly. Score out of 10 based on closeness to goals. Be encouraging but honest."
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Daily Summary Error:", error);
    const fallback: DailyAnalysisResult = {
      score: 5,
      headline: "Analysis Unavailable",
      positives: ["Logged meals today"],
      improvements: ["Check connection for details"],
      tip: "Try again later!"
    };
    return JSON.stringify(fallback);
  }
};

export const getMealSuggestions = async (remaining: MacroNutrients, mealType: string): Promise<MealSuggestion[]> => {
  try {
    const prompt = `
      Recommend 3 healthy ${mealType} options that fit within these remaining macros:
      Calories: ${remaining.calories}
      Protein: ${remaining.protein}g
      Carbs: ${remaining.carbs}g
      Fat: ${remaining.fat}g
      
      Make them simple to cook and varied.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mealSuggestionSchema,
        systemInstruction: "You are a creative chef and nutritionist. Suggest meals that strictly fit within the remaining macro budget. Be specific."
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data.suggestions || [];
  } catch (error) {
    console.error("Meal Suggestion Error:", error);
    return [];
  }
};

export const generateFullRecipe = async (mealName: string): Promise<Recipe> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a detailed recipe for: "${mealName}". Include precise ingredients and step-by-step cooking instructions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        systemInstruction: "You are an expert chef. Provide clear, easy-to-follow recipes."
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    throw new Error("Failed to generate recipe.");
  }
};

export const getCookingAssistantResponse = async (recipeName: string, userQuery: string, imageBase64?: string): Promise<string> => {
  try {
    const parts: any[] = [];
    
    if (imageBase64) {
        let mimeType = "image/jpeg";
        let data = imageBase64;

        if (imageBase64.includes(';base64,')) {
            const matches = imageBase64.match(/^data:(.*);base64,(.*)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                data = matches[2];
            }
        }
        
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: data
            }
        });
    }
    
    parts.push({
        text: `Recipe Context: ${recipeName}\nUser Question: ${userQuery}`
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: "You are a helpful AI Sous Chef assisting a user while they cook. Keep answers short, encouraging, and focused on the cooking task. If the user sends an image, analyze it to give specific advice."
      }
    });

    return response.text || "I'm listening, Chef!";
  } catch (error) {
    console.error("Cooking Assistant Error:", error);
    return "Sorry, I can't help with that right now.";
  }
};
