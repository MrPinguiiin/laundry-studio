
import { json } from '@sveltejs/kit';
import { laundryStore } from '$lib/server/laundryState';

export async function POST({ request }) {
	const { sessionId } = await request.json();
	
	if (!sessionId) {
		return json({ error: 'Session ID required' }, { status: 400 });
	}

	const machineId = laundryStore.claim(sessionId);
	
	if (machineId) {
		return json({ success: true, machineId });
	} else {
		return json({ success: false, error: 'All machines occupied' }, { status: 503 });
	}
}
