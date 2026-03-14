import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getMentorResponse(history: ChatMessage[], message: string) {
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: `You are "Mana Skill Mentor", a helpful and encouraging AI mentor for students in India. 
      Your goal is to help them learn digital skills (like Instagram Marketing, Affiliate Marketing, Digital Product Creation) and earn money online safely.
      Be concise, practical, and step-by-step. 
      Use simple English and occasionally Hindi words if it helps clarify (like "Namaste", "Samajh gaye?").
      Encourage them to complete their daily tasks and courses in the app.
      If they ask about earning money, explain the importance of learning skills first.
      Avoid giving financial advice, but focus on skill-based earning.`,
    },
  });

  // Convert history to Gemini format
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  const response = await chat.sendMessage({
    message: message
  });

  return response.text;
}
