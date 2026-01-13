import { json, type RequestHandler } from '@sveltejs/kit';
import { removeBackground, parseDataUrl } from '$lib/server/services/index.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { image } = body;

		if (!image) {
			return json({ success: false, error: 'No image provided' }, { status: 400 });
		}

		// Parse data URL to get base64 and mime type
		const parsed = parseDataUrl(image);
		if (!parsed) {
			return json({ success: false, error: 'Invalid image data URL format' }, { status: 400 });
		}

		// Call the remove background service
		const result = await removeBackground(parsed.data, parsed.mimeType);

		if (!result.success) {
			return json({ success: false, error: result.error }, { status: 500 });
		}

		// Return the result with data URL format
		return json({
			success: true,
			image: `data:${result.mimeType};base64,${result.imageBase64}`
		});
	} catch (error) {
		console.error('API Error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Internal server error'
			},
			{ status: 500 }
		);
	}
};
