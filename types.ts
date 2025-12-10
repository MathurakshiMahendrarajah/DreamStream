export interface GameState {
  isPlaying: boolean;
  currentScene: SceneData | null;
  history: SceneData[];
  loading: boolean;
  loadingMessage: string;
  error: string | null;
}

export interface SceneData {
  id: string;
  narrative: string; // The story text
  visualPrompt: string; // The prompt used to generate the image
  imageUrl?: string; // The base64 image data
  options: ActionOption[];
  ambience: 'nature' | 'mechanical' | 'eerie' | 'calm' | 'chaos'; // Audio atmosphere
}

export interface ActionOption {
  label: string;
  actionPrompt: string; // The prompt to send to Gemini for the next step
}

export enum ModelType {
  LOGIC = 'gemini-2.5-flash',
  IMAGE = 'gemini-2.5-flash-image', 
}