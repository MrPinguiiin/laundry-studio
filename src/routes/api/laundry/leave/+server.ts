
import { laundryStore } from '$lib/server/laundryState.ts';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	const { sessionId } = await request.json();

	if (sessionId) {
		laundryStore.leave(sessionId);
	}

	return json({ success: true });
}
