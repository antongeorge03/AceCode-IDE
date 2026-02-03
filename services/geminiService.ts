import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, Language } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!API_KEY) {
      console.error("API Key is missing. Check .env.local");
    }
    this.genAI = new GoogleGenerativeAI(API_KEY);

    this.model = this.genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });
  }

  async chat(
    messages: Message[],
    currentCode: string,
    language: Language,
  ): Promise<string> {
    if (!API_KEY) return "Error: API Key is missing.";

    try {
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = this.model.startChat({
        history: history,
      });

      const prompt = `
Context: You are an expert coding assistant inside a web IDE.
Current Language: ${language}
Current Code:
\`\`\`${language}
${currentCode}
\`\`\`

User Question: ${messages[messages.length - 1].content}

Please provide a helpful, concise response.
`;

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return `Error: Failed to connect to Gemini. ${error.message}`;
    }
  }
}

export const geminiService = new GeminiService();
