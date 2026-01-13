
import type { MachineState } from '$lib/types';

class LaundryStore {
	private machines: MachineState[];

	constructor() {
		this.machines = [
			{ id: 1, status: 'idle', occupantId: null, imageUrl: null, resultUrl: null, startTime: null },
			{ id: 2, status: 'idle', occupantId: null, imageUrl: null, resultUrl: null, startTime: null },
			{ id: 3, status: 'idle', occupantId: null, imageUrl: null, resultUrl: null, startTime: null }
		];
	}

	getAll() {
		return this.machines;
	}

	get(id: number) {
		return this.machines.find(m => m.id === id);
	}

	claim(sessionId: string): number | null {
		// Check if user already has a machine
		const existing = this.machines.find(m => m.occupantId === sessionId);
		if (existing) return existing.id;

		// Find first idle machine
		const available = this.machines.find(m => m.status === 'idle' && !m.occupantId);
		if (available) {
			available.occupantId = sessionId;
			available.status = 'occupied';
			return available.id;
		}
		return null; // Full
	}

	update(sessionId: string, data: Partial<MachineState>) {
		const machine = this.machines.find(m => m.occupantId === sessionId);
		if (machine) {
			Object.assign(machine, data);
			return machine;
		}
		return null;
	}

	leave(sessionId: string) {
		const machine = this.machines.find(m => m.occupantId === sessionId);
		if (machine) {
			machine.status = 'idle';
			machine.occupantId = null;
			machine.imageUrl = null;
			machine.resultUrl = null;
			machine.startTime = null;
		}
	}
}

// Global Singleton
export const laundryStore = new LaundryStore();
