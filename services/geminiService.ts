
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, CompetitorAnalysis, SalesStrategy, Signal, CallAnalysis, TranscriptLine } from "../types";

// API Key is strictly pulled from process.env for Vercel/Production safety
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please set API_KEY in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateLeadsBatch = async (
  query: string,
  batchSize: number,
  batchIndex: number,
  ignoreList: string[] = []
): Promise<Lead[]> => {
  const ai = getAI();
  const modelId = "gemini-3-flash-preview"; 

  const exclusionText = ignoreList.length > 0 
    ? `EXCLUDE these specific companies: ${ignoreList.slice(-50).join(", ")}.` 
    : "";

  const prompt = `
    ROLE: Elite B2B Data Researcher specializing in high-accuracy verified data.
    TASK: Generate ${batchSize} high-quality, realistic B2B leads matching: "${query}".
    CONTEXT: Batch #${batchIndex + 1}. ${exclusionText}
    
    STRICT DATA QUALITY RULES:
    1. Only return leads you have high confidence (85%+) exist in the real world.
    2. Prioritize companies with valid websites and professional management.
    3. Ensure the "confidence" field reflects data completeness (Management names + Socials = 90+).
    
    REQUIRED JSON STRUCTURE (Array of Objects):
    [
      {
        "company": "string",
        "description": "1 sentence summary",
        "location": "City, Country",
        "googleMapsUrl": "string",
        "confidence": number, // 85 to 99
        "website": "string",
        "contact": "Phone Number",
        "industry": "string",
        "employees": "string",
        "socials": { "linkedin": "url" },
        "management": [{ "name": "string", "role": "string", "email": "string" }]
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const rawData = JSON.parse(text);
    
    return rawData.map((l: any, i: number) => {
      // Ensure a high-quality floor for confidence
      const aiConfidence = l.confidence || 88;
      const confidenceFloor = Math.max(aiConfidence, 85);
      
      return {
        ...l,
        id: Date.now() + i + Math.random(), 
        confidence: confidenceFloor,
        status: 'new',
        activity: [{
          id: `create_${Date.now()}_${i}`,
          type: 'creation',
          content: 'Lead discovered via Premium AI Analysis',
          author: 'System',
          timestamp: new Date().toISOString()
        }]
      };
    });
  } catch (error) {
    console.error("Lead generation batch failed:", error);
    return []; 
  }
};

export const analyzeCompetitorsText = async (website: string, location?: string): Promise<string> => {
  const ai = getAI();
  const prompt = `Perform a deep competitor analysis for ${website} in the ${location || 'global'} market. 
  Identify top 5 competitors, their strengths, weaknesses, and recent news.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { 
      tools: [{ googleSearch: {} }],
      temperature: 0.4
    }
  });
  
  return response.text || "Analysis failed.";
};

export const analyzeCompetitors = async (website: string, location?: string): Promise<CompetitorAnalysis | null> => {
  const ai = getAI();
  const prompt = `Analyze competitors for ${website} in ${location || 'global market'}. 
  Return a valid JSON object matching the CompetitorAnalysis interface. 
  DO NOT include markdown formatting, just the raw JSON.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      temperature: 0.1
    }
  });
  
  return JSON.parse(response.text || "null");
};

export const findLookalikes = async (website: string): Promise<Lead[]> => {
  const ai = getAI();
  const prompt = `Find 10 companies similar to ${website}. Return as a JSON array of Lead objects. Use high confidence scores (90+).`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      temperature: 0.2
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateSalesStrategy = async (productDescription: string): Promise<SalesStrategy | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: 'user', parts: [{ text: `Generate a detailed B2B sales strategy for: ${productDescription}. Return as JSON.` }] }],
    config: { 
      responseMimeType: "application/json",
      temperature: 0.3
    }
  });
  return JSON.parse(response.text || "null");
};

export const chatWithPersona = async (lead: Lead, history: ChatMessage[], userInput: string): Promise<string> => {
  const ai = getAI();
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  contents.push({
    role: 'user',
    parts: [{ text: userInput }]
  });

  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction: `You are roleplaying as a B2B prospect from ${lead.company}. You are busy, skeptical, but open to real value. Industry: ${lead.industry}.`
    }
  });
  return response.text || "...";
};

export const getCoachingFeedback = async (history: ChatMessage[]): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: `Analyze this sales conversation and provide constructive feedback in JSON format including fields "score", "summary", "strengths", "weaknesses", and "improved_pitch": ${JSON.stringify(history)}` }] }],
    config: { 
      responseMimeType: "application/json",
      temperature: 0.2
    }
  });
  return JSON.parse(response.text || "{}");
};

export const monitorLeadSignals = async (leads: Lead[]): Promise<Signal[]> => {
  const ai = getAI();
  const leadNames = leads.map(l => l.company).join(', ');
  const prompt = `Check for recent major business signals (funding, M&A, hiring) for these companies: ${leadNames}. 
  Return as a JSON array of Signal objects.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      temperature: 0.1
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateCallScript = async (lead: Lead): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: `Generate a cold call script for ${lead.company} in the ${lead.industry} industry.` }] }]
  });
  return response.text || "Failed to generate script.";
};

export const extractLeadFromImage = async (file: File): Promise<Lead> => {
  const ai = getAI();
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: "Extract lead info from this business card image as JSON." },
        { inlineData: { mimeType: file.type, data: base64Data } }
      ]
    },
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const extractLeadFromVCard = async (vcardText: string): Promise<Lead> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: `Parse this vCard into a Lead JSON: ${vcardText}` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};

export const generateCallAnalysis = async (transcript: TranscriptLine[], notes: string): Promise<CallAnalysis> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: `Analyze this call transcript: ${JSON.stringify(transcript)} with notes: ${notes}. Return as JSON.` }] }],
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || "{}");
};
