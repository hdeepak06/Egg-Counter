import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeProtein(message: string) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are a professional nutrition and protein analyzer for an app called "Egg Counter". 
  Your goal is to help users understand the nutritional value of eggs and other protein sources. 
  One large egg typically has about 6-7g of protein. 
  Keep responses concise, professional, and encouraging. 
  If the user asks about their egg consumption, use the context of their logs if provided (though you primarily analyze the current query).`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: message,
      config: {
        systemInstruction,
      },
    });
    return response.text || "I couldn't analyze that right now. Please try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting to my nutrition database.";
  }
}
