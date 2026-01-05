import { GoogleGenAI } from "@google/genai";
import { Lead, CompetitorAnalysis, SalesStrategy, Signal, CallAnalysis, TranscriptLine } from "../types";

// Configuration: Increase timeout for Vercel (up to 60s for Hobby, 300s for Pro)
export const maxDuration = 60; 

const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please set API_KEY in Vercel Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Use stable models for production reliability
const STABLE_FLASH_MODEL = "gemini-2.0-flash"; 
const STABLE_PRO_MODEL = "gemini-2.0-pro-exp"; // Or gemini-1.5-pro

export const generateLeadsBatch = async (
  query: string,
  batchSize: number,
  batchIndex: number,
  ignoreList: string[] = []
): Promise<Lead[]> => {
  const ai = getAI();
  
  const exclusionText = ignoreList.length > 0 
    ? `EXCLUDE these specific companies: ${ignoreList.slice(-50).join(", ")}.` 
    : "";

  const prompt = `
    ROLE: Elite B2B Data Researcher.
    TASK: Generate ${batchSize} high-quality, real-world B2B leads matching: "${query}".
    CONTEXT: Batch #${batchIndex + 1}. ${exclusionText}
    
    STRICT DATA QUALITY RULES:
    1. Only return leads that exist in the real world.
    2. Provide valid websites and professional details.
    
    RETURN ONLY JSON ARRAY:
    [{ "company": "string", "description": "string", "location": "string", "website": "string", "confidence": number }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: STABLE_FLASH_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        // This tool allows Gemini to browse the live web for accurate leads
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const rawData = JSON.parse(text);
    
    return rawData.map((l: any, i: number) => ({
      ...l,
      id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'new',
      confidence: l.confidence || 90,
      activity: [{
        id: `reg_${Date.now()}`,
        type: 'creation',
        content: 'Lead discovered via Real-time AI Search',
        author: 'System',
        timestamp: new Date().toISOString()
      }]
    }));
  } catch (error) {
    console.error("Lead generation failed:", error);
    return []; 
  }
};

export const analyzeCompetitors = async (website: string, location?: string): Promise<CompetitorAnalysis | null> => {
  const ai = getAI();
  const prompt = `Deep analyze competitors for ${website} in ${location || 'global market'}. Return JSON.`;
  
  try {
    const response = await ai.models.generateContent({
      model: STABLE_FLASH_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    return JSON.parse(response.text || "null");
  } catch (e) {
    return null;
  }
};

// ... (Other functions follow same pattern: update model to STABLE_FLASH_MODEL)
