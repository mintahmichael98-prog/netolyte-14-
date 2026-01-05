import { GoogleGenAI } from "@google/genai";
import { Lead, CompetitorAnalysis, SalesStrategy, Signal, CallAnalysis, TranscriptLine } from "../types";

// Vercel Timeout: Increase to 60s for Hobby plan
export const maxDuration = 60; 

const getAI = () => {
  // Checks for both common API key variable names
  const apiKey = process.env.API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please set API_KEY in Vercel Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Stable models as of 2026
const FLASH_MODEL = "gemini-2.5-flash"; 
const PRO_MODEL = "gemini-3-pro";

/**
 * 1. GENERATE LEADS (With Google Search Grounding)
 */
export const generateLeadsBatch = async (
  query: string,
  batchSize: number,
  batchIndex: number,
  ignoreList: string[] = []
): Promise<Lead[]> => {
  const ai = getAI();
  const exclusionText = ignoreList.length > 0 ? `EXCLUDE: ${ignoreList.slice(-50).join(", ")}.` : "";

  const prompt = `Generate ${batchSize} real B2B leads for: "${query}". ${exclusionText} 
  Return a JSON array with company, description, location, website, and confidence.`;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }], // Crucial for real-world leads
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawData = JSON.parse(response.text || "[]");
    return rawData.map((l: any, i: number) => ({
      ...l,
      id: `lead_${Date.now()}_${i}`,
      status: 'new',
      confidence: l.confidence || 90,
      activity: [{ id: `a_${Date.now()}`, type: 'creation', content: 'Lead found', author: 'System', timestamp: new Date().toISOString() }]
    }));
  } catch (error) {
    console.error("Lead generation failed:", error);
    return [];
  }
};

/**
 * 2. FIND LOOKALIKES (The missing export fix)
 */
export const findLookalikes = async (website: string): Promise<Lead[]> => {
  const ai = getAI();
  const prompt = `Find 10 companies similar to ${website}. Return as a JSON array of Lead objects.`;
  
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json" 
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

/**
 * 3. COMPETITOR ANALYSIS
 */
export const analyzeCompetitors = async (website: string, location?: string): Promise<CompetitorAnalysis | null> => {
  const ai = getAI();
  const prompt = `Deep competitor analysis for ${website} in ${location || 'global'}. Return JSON.`;
  
  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "null");
  } catch (e) {
    return null;
  }
};

/**
 * 4. SALES STRATEGY
 */
export const generateSalesStrategy = async (productDescription: string): Promise<SalesStrategy | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: [{ role: 'user', parts: [{ text: `Strategy for: ${productDescription}. Return JSON.` }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "null");
  } catch (e) {
    return null;
  }
};

/**
 * 5. CHAT & COACHING
 */
export const chatWithPersona = async (lead: Lead, history: ChatMessage[], userInput: string): Promise<string> => {
  const ai = getAI();
  const contents = [...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userInput }] }];
  
  const response = await ai.models.generateContent({ 
    model: FLASH_MODEL, 
    contents,
    config: { systemInstruction: `You are a B2B prospect from ${lead.company}.` }
  });
  return response.text || "...";
};

export const getCoachingFeedback = async (history: ChatMessage[]): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Analyze this chat: ${JSON.stringify(history)}. Return JSON.` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

/**
 * 6. SIGNALS & SCRIPTS
 */
export const monitorLeadSignals = async (leads: Lead[]): Promise<Signal[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Signals for: ${leads.map(l => l.company)}. Return JSON.` }] }],
    config: { tools: [{ googleSearch: {} }], responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "[]");
};

export const generateCallScript = async (lead: Lead): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Call script for ${lead.company}.` }] }]
  });
  return response.text || "Script failed.";
};

/**
 * 7. UTILITIES (Images, vCards, Analysis)
 */
export const extractLeadFromImage = async (file: File): Promise<Lead> => {
  const ai = getAI();
  const base64Data = await new Promise<string>((res) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res((reader.result as string).split(',')[1]);
  });

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ parts: [{ text: "Extract lead JSON from card." }, { inlineData: { mimeType: file.type, data: base64Data } }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const extractLeadFromVCard = async (vcardText: string): Promise<Lead> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Parse vCard: ${vcardText}` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const generateCallAnalysis = async (transcript: TranscriptLine[], notes: string): Promise<CallAnalysis> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: [{ role: 'user', parts: [{ text: `Analyze: ${JSON.stringify(transcript)} Notes: ${notes}` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};
