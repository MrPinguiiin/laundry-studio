import { json } from '@sveltejs/kit';
import { laundryStore } from '$lib/server/laundryState';

export function GET() {
	return json({
		machines: laundryStore.getAll()
	});
}
