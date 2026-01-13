
export interface MachineState {
	id: number; // 1 | 2 | 3
	status: 'idle' | 'occupied' | 'washing' | 'done';
	occupantId: string | null; // Session ID of the user
	imageUrl: string | null;
	resultUrl: string | null;
	startTime: number | null;
}
