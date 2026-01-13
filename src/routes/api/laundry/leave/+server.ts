
import { laundryStore } from '$lib/server/laundryState';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	const { sessionId } = await request.json();

	if (sessionId) {
		laundryStore.leave(sessionId);
	}

	return json({ success: true });
}
