<script lang="ts">
	import AnimeLaundromat from '$lib/components/AnimeLaundromat.svelte';
	import type { MachineState } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';

	let imageFile: File | null = $state(null);
	let originalImage: string | null = $state(null);
	let resultImage: string | null = $state(null);
	let isLoading = $state(false);
	let errorMessage: string | null = $state(null);
	let isDragging = $state(false);

	// Multiplayer State
	let sessionId = $state('');
	let myMachineId: number | null = $state(null);
	let machines: MachineState[] = $state([]);
	let pollingInterval: number;

	onMount(() => {
		sessionId = localStorage.getItem('laundry_session_id') || Math.random().toString(36).substring(7);
		localStorage.setItem('laundry_session_id', sessionId);

		(async () => {
			try {
				const res = await fetch('/api/laundry/claim', {
					method: 'POST',
					body: JSON.stringify({ sessionId })
				});
				const data = await res.json();
				if (data.success) {
					myMachineId = data.machineId;
				} else {
					errorMessage = "Laundry is full! You are in spectator mode.";
				}
			} catch (e) {
				console.error("Failed to claim machine", e);
			}
		})();

		pollStatus();
		pollingInterval = setInterval(pollStatus, 1000);
		
		window.addEventListener('beforeunload', leaveMachine);

		return () => {
			clearInterval(pollingInterval);
			window.removeEventListener('beforeunload', leaveMachine);
			leaveMachine();
		};
	});

	async function pollStatus() {
		try {
			const res = await fetch('/api/laundry/status');
			const data = await res.json();
			machines = data.machines;

			// Sync local specific state with server if needed
			if (myMachineId) {
				const myMachine = machines.find(m => m.id === myMachineId);
				if (myMachine && myMachine.resultUrl && !resultImage) {
					// Someone else finished it? Or we refreshed?
					// Syncing result logic is complex, for now trust local flow -> server
				}
			}
		} catch (e) {
			console.error("Polling error", e);
		}
	}

	async function leaveMachine() {
		if (myMachineId) {
			navigator.sendBeacon('/api/laundry/leave', JSON.stringify({ sessionId }));
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files?.[0]) {
			processFile(input.files[0]);
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		if (event.dataTransfer?.files?.[0]) {
			processFile(event.dataTransfer.files[0]);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	$effect(() => {
		const handleWindowDragEnter = (e: DragEvent) => {
			if (e.dataTransfer?.types.includes('Files')) {
				isDragging = true;
			}
		};
		window.addEventListener('dragenter', handleWindowDragEnter);
		return () => window.removeEventListener('dragenter', handleWindowDragEnter);
	});

	function processFile(file: File) {
		if (!myMachineId) {
			errorMessage = "You don't have a machine! Wait for one to free up.";
			return;
		}

		if (!file.type.startsWith('image/')) {
			errorMessage = 'Please upload an image file';
			return;
		}

		imageFile = file;
		errorMessage = null;
		resultImage = null;

		const reader = new FileReader();
		reader.onload = (e) => {
			originalImage = e.target?.result as string;
			// Sync upload to server
			updateServerState({ imageUrl: originalImage, status: 'occupied' });
		};
		reader.readAsDataURL(file);
	}

	async function updateServerState(data: any) {
		if (!sessionId) return;
		await fetch('/api/laundry/update', {
			method: 'POST',
			body: JSON.stringify({ sessionId, data })
		});
		pollStatus(); // Immediate sync
	}

	async function removeBackground() {
		if (!originalImage) return;

		isLoading = true;
		errorMessage = null;
		updateServerState({ status: 'washing', startTime: Date.now() });

		try {
			const response = await fetch('/api/remove-background', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ image: originalImage })
			});

			const data = await response.json();

			if (data.success) {
				resultImage = data.image;
				updateServerState({ status: 'done', resultUrl: resultImage });
			} else {
				errorMessage = data.error || 'Failed to remove background';
				updateServerState({ status: 'occupied' }); // Revert
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'An error occurred';
			updateServerState({ status: 'occupied' });
		} finally {
			isLoading = false;
		}
	}

	function downloadImage() {
		if (!resultImage) return;

		const link = document.createElement('a');
		link.href = resultImage;
		link.download = `cleaned-${Date.now()}.png`;
		link.click();
	}

	function reset() {
		imageFile = null;
		originalImage = null;
		resultImage = null;
		errorMessage = null;
		updateServerState({ 
			status: 'idle', 
			imageUrl: null, 
			resultUrl: null, 
			startTime: null 
		});
		// Note: We don't leave the machine, just reset its state
	}
</script>

<svelte:head>
	<title>Laundry Studio - AI Background Remover</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Full screen drop zone -->
<div 
	class="drop-zone-full"
	class:dragging={isDragging}
	role="button"
	tabindex="-1"
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
></div>

<!-- 2D Background Scene (AnimeJS) -->
<div class="scene-container">
	<AnimeLaundromat 
		{machines}
		{myMachineId}
		uploadedImage={originalImage} 
		{resultImage} 
		isProcessing={isLoading} 
	/>
</div>

<!-- Vignette overlay -->
<div class="vignette"></div>

<!-- Minimal UI Overlay - Corner pinned like reference -->
<div class="ui-overlay">
	<!-- Top Left - Brand -->
	<div class="corner top-left">
		<div class="brand">
			<span class="brand-icon">🧺</span>
			<span class="brand-name">LAUNDRY STUDIO</span>
		</div>
		<div class="brand-sub">AI Background Remover</div>
	</div>

	<!-- Top Right - Status -->
	<div class="corner top-right">
		{#if isLoading}
			<div class="status-badge processing">
				<span class="pulse"></span>
				<span>Processing...</span>
			</div>
		{:else if resultImage}
			<div class="status-badge success">
				<span>✓</span>
				<span>Complete</span>
			</div>

			
		{/if}
	</div>

	<!-- Bottom Left - Drop zone hint -->
	<div class="corner bottom-left">
		{#if !originalImage}
			<div class="drop-hint" class:active={isDragging}>
				<div class="drop-icon">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/>
						<path d="M12 8v8M8 12h8"/>
					</svg>
				</div>
				<div class="drop-text">
					<span>Drag & Drop Images</span>
					<label class="browse-link">
						or browse
						<input type="file" accept="image/*" onchange={handleFileSelect} hidden />
					</label>
				</div>
			</div>
		{:else}
			<div class="action-buttons">
				{#if !resultImage && !isLoading}
					<button class="action-btn primary" onclick={removeBackground}>
						<span class="btn-icon">▶</span>
						<span>Start Wash</span>
					</button>
				{/if}

				{#if resultImage}
					<button class="action-btn success" onclick={downloadImage}>
						<span class="btn-icon">↓</span>
						<span>Download</span>
					</button>
				{/if}

				<button class="action-btn ghost" onclick={reset}>
					<span class="btn-icon">×</span>
					<span>Reset</span>
				</button>
			</div>
		{/if}
	</div>

	<!-- Bottom Right - Instructions -->
	<div class="corner bottom-right">
		<div class="instructions">
			<span>⟲ Drag to orbit</span>
			<span>⊕ Scroll to zoom</span>
		</div>
	</div>

	<!-- Center - Error message -->
	{#if errorMessage}
		<div class="center-message error">
			<span>⚠ {errorMessage}</span>
			<button onclick={() => (errorMessage = null)}>×</button>
		</div>
	{/if}
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		font-family: 'JetBrains Mono', monospace;
		background: #0a0a12;
		color: #fff;
		overflow: hidden;
	}

	.scene-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 0;
	}

	.drop-zone-full {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 5;
		pointer-events: none; /* Default: Let clicks pass to scene */
		transition: background 0.3s;
	}

	.drop-zone-full.dragging {
		background: rgba(255, 136, 68, 0.1);
		border: 2px dashed rgba(255, 136, 68, 0.5);
		pointer-events: all; /* Enable drop target only when dragging */
	}

	.vignette {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 8;
		background: radial-gradient(
			ellipse at center,
			transparent 30%,
			rgba(10, 10, 18, 0.4) 70%,
			rgba(10, 10, 18, 0.8) 100%
		);
	}

	.ui-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
		pointer-events: none;
	}

	.ui-overlay > * {
		pointer-events: auto;
	}

	.corner {
		position: absolute;
		padding: 1.5rem;
	}

	.top-left {
		top: 0;
		left: 0;
	}

	.top-right {
		top: 0;
		right: 0;
	}

	.bottom-left {
		bottom: 0;
		left: 0;
	}

	.bottom-right {
		bottom: 0;
		right: 0;
	}

	/* Brand */
	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.brand-icon {
		font-size: 1.5rem;
	}

	.brand-name {
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		color: #ff8844;
	}

	.brand-sub {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.25rem;
		letter-spacing: 0.1em;
	}

	/* Status */
	.status-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
	}

	.status-badge.processing {
		background: rgba(255, 136, 68, 0.2);
		border: 1px solid rgba(255, 136, 68, 0.4);
		color: #ff8844;
	}

	.status-badge.success {
		background: rgba(56, 239, 125, 0.2);
		border: 1px solid rgba(56, 239, 125, 0.4);
		color: #38ef7d;
	}

	.pulse {
		width: 8px;
		height: 8px;
		background: #ff8844;
		border-radius: 50%;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	/* Drop hint */
	.drop-hint {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		transition: all 0.3s ease;
	}

	.drop-hint.active {
		border-color: #ff8844;
		background: rgba(255, 136, 68, 0.1);
	}

	.drop-icon {
		color: rgba(255, 255, 255, 0.5);
	}

	.drop-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.drop-text span {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.browse-link {
		font-size: 0.7rem;
		color: #ff8844;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.browse-link:hover {
		color: #ffaa66;
	}

	/* Action buttons */
	.action-buttons {
		display: flex;
		gap: 0.75rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border: none;
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #ff8844, #ff6622);
		color: #fff;
	}

	.action-btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(255, 136, 68, 0.4);
	}

	.action-btn.success {
		background: linear-gradient(135deg, #11998e, #38ef7d);
		color: #fff;
	}

	.action-btn.success:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(56, 239, 125, 0.4);
	}

	.action-btn.ghost {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.action-btn.ghost:hover {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.btn-icon {
		font-size: 0.9rem;
	}

	/* Instructions */
	.instructions {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: right;
	}

	.instructions span {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.3);
		letter-spacing: 0.05em;
	}

	/* Center message */
	.center-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		font-size: 0.8rem;
	}

	.center-message.error {
		background: rgba(255, 82, 82, 0.2);
		border: 1px solid rgba(255, 82, 82, 0.4);
		color: #ff5252;
	}

	.center-message button {
		background: none;
		border: none;
		color: inherit;
		font-size: 1.2rem;
		cursor: pointer;
		opacity: 0.7;
	}

	.center-message button:hover {
		opacity: 1;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.corner {
			padding: 1rem;
		}

		.brand-name {
			font-size: 0.75rem;
		}

		.action-buttons {
			flex-direction: column;
		}

		.instructions {
			display: none;
		}
	}
</style>
