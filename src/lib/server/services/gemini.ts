import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Model configurations
export const MODELS = {
	IMAGE_GENERATION: 'gemini-2.5-flash-image',
	TEXT: 'gemini-2.0-flash'
} as const;

export { ai };
