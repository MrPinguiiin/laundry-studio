import { ai, MODELS } from "./gemini.ts";

export interface RemoveBackgroundResult {
	success: boolean;
	imageBase64?: string;
	mimeType?: string;
	error?: string;
}

export async function removeBackground(
	imageBase64: string,
	mimeType: string = 'image/png'
): Promise<RemoveBackgroundResult> {
	try {
		const prompt = [
			{
				text: `Remove the background from this image completely and make it transparent. 
						Keep only the main subject/foreground of the image. 
						The output should be a PNG image with a transparent background.
						Do not add any new elements, just remove the background.`
			},
			{
				inlineData: {
					mimeType: mimeType,
					data: imageBase64
				}
			}
		];

		const response = await ai.models.generateContent({
			model: MODELS.IMAGE_GENERATION,
			contents: prompt
		});

		if (!response.candidates?.[0]?.content?.parts) {
			return {
				success: false,
				error: 'No response from AI model'
			};
		}

		for (const part of response.candidates[0].content.parts) {
			if (part.inlineData) {
				return {
					success: true,
					imageBase64: part.inlineData.data,
					mimeType: part.inlineData.mimeType || 'image/png'
				};
			}
		}

		return {
			success: false,
			error: 'No image generated in response'
		};
	} catch (error) {
		console.error('Remove background error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}

export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
	const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
	if (!match) return null;
	return {
		mimeType: match[1],
		data: match[2]
	};
}
