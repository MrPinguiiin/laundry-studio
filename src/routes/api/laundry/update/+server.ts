
import { json } from '@sveltejs/kit';
import { laundryStore } from '$lib/server/laundryState';

export async function POST({ request }) {
	const { sessionId, data } = await request.json();

	if (!sessionId || !data) {
		return json({ error: 'Missing parameters' }, { status: 400 });
	}

	const updatedMachine = laundryStore.update(sessionId, data);

	if (updatedMachine) {
		return json({ success: true, machine: updatedMachine });
	} else {
		return json({ success: false, error: 'Machine not found for session' }, { status: 404 });
	}
}
