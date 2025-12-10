import { GoogleGenAI, Type } from "@google/genai";
import { SceneData, ModelType } from "../types";

// Helper to ensure API key exists
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSceneLogic = async (
  userInput: string,
  historySummary: string
): Promise<Omit<SceneData, "imageUrl" | "id">> => {
  const ai = getClient();
  
  const systemInstruction = `
    You are a visual interactive story engine designed to create gripping, cinematic adventures.

    CRITICAL RULES:
    1. **NARRATIVE**: Must be in VERY SIMPLE ENGLISH. Grade 3 readability. Max 35 words. 
       - START DIRECTLY with the action or visual. Do not say "You see".
       - INCLUDE A TWIST or UNEXPECTED DETAIL in every scene to keep it interesting.
       - Focus on mystery, danger, or wonder.
    2. **VISUAL PROMPT**: Describe a cinematic, high-resolution, digital art scene. Focus on lighting, atmosphere, and composition. NO TEXT in the image.
    3. **OPTIONS**: Provide 2-3 simple choices. One should be risky or surprising.
    4. **AMBIENCE**: Select the most appropriate soundscape: 'nature', 'mechanical', 'eerie', 'calm', 'chaos'.
    
    Goal: Hook the player immediately. Make the story unpredictable.
    
    Context:
    Previous Story: ${historySummary}
  `;

  const response = await ai.models.generateContent({
    model: ModelType.LOGIC,
    contents: userInput,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          ambience: { type: Type.STRING, enum: ['nature', 'mechanical', 'eerie', 'calm', 'chaos'] },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                actionPrompt: { type: Type.STRING, description: "The text to feed back into the model if this option is chosen" },
              },
              required: ["label", "actionPrompt"]
            },
          },
        },
        required: ["narrative", "visualPrompt", "options", "ambience"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response from logic model");
  }

  return JSON.parse(response.text);
};

export const generateSceneImage = async (visualPrompt: string): Promise<string> => {
  const ai = getClient();
  
  // Using gemini-2.5-flash-image for generation
  try {
    const response = await ai.models.generateContent({
      model: ModelType.IMAGE,
      contents: {
        parts: [{ text: `Cinematic concept art, award winning, 8k resolution, dramatic lighting, detailed texture: ${visualPrompt}` }]
      },
    });

    // Check for inline data (image)
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (e) {
    console.error("Image generation failed", e);
    throw e;
  }
};