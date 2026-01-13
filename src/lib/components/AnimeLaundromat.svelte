<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';
	import gsap from 'gsap';
	import ClothesLine from './ClothesLine.svelte'; // New Component

	let {
		uploadedImage = null,
		resultImage = null, // Deprecated in favor of machine state
		isProcessing = false, // Deprecated
		machines = [],
		myMachineId = null
	}: {
		uploadedImage: string | null;
		resultImage: string | null;
		isProcessing: boolean;
		machines: MachineState[];
		myMachineId: number | null;
	} = $props();

	let containerRef: HTMLDivElement;
	let ctx: gsap.Context;

	// Relative Positioning Logic: "I am always the center"
	let centerMachine = $derived(
		myMachineId 
			? machines.find(m => m.id === myMachineId) 
			: machines.find(m => m.id === 2) || machines[1]
	);

	let leftMachine = $derived(
		myMachineId
			? machines.find(m => m.id !== myMachineId && m.id < myMachineId) || machines.find(m => m.id !== myMachineId && m.id > myMachineId) // Simplified logic: Just pick others
			: machines.find(m => m.id === 1) || machines[0]
	);
	
	// Better neighbor logic:
	// If I am 1: Center=1, Left=3, Right=2
	// If I am 2: Center=2, Left=1, Right=3
	// If I am 3: Center=3, Left=2, Right=1
	// Order: 1 -> 2 -> 3 -> 1
	
	let orderedMachines = $derived.by(() => {
		if (!machines.length) return [null, null, null];
		if (!myMachineId) return [
			machines.find(m => m.id === 1), 
			machines.find(m => m.id === 2), 
			machines.find(m => m.id === 3)
		];
		
		const me = machines.find(m => m.id === myMachineId);
		const others = machines.filter(m => m.id !== myMachineId).sort((a, b) => a.id - b.id);
		
		return [others[0], me, others[1]];
	});

	let leftM = $derived(orderedMachines[0]);
	let centerM = $derived(orderedMachines[1]); // Hero
	let rightM = $derived(orderedMachines[2]);

	onMount(() => {
		ctx = gsap.context(() => {
			// Initial setup (GSAP code remains same)
			gsap.set('.machine-3d', { 
				transformStyle: 'preserve-3d',
				transformPerspective: 1000
			});

			// 1. Idle Floating Animation (3D)
			gsap.to('.machine-grid', {
				rotationY: 5,
				rotationX: -2,
				duration: 5,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut'
			});

			// 2. Mouse Parallax
			const handleMouseMove = (e: MouseEvent) => {
				const x = (e.clientX / window.innerWidth - 0.5) * 20;
				const y = (e.clientY / window.innerHeight - 0.5) * 10;
				
				gsap.to('.machine-grid', {
					rotationY: x, // Rotate grid based on mouse
					rotationX: -y,
					duration: 1,
					ease: 'power2.out'
				});
			};
			window.addEventListener('mousemove', handleMouseMove);

			return () => window.removeEventListener('mousemove', handleMouseMove);
		}, containerRef);

		// DEBUG: Log what is being clicked
		const debugClick = (e: MouseEvent) => {
			console.log("CLICK TARGET:", e.target);
		};
		window.addEventListener('click', debugClick);
		
		// TEST: Auto-trigger animation after 3s to prove it looks correct
		/*
		setTimeout(() => {
			console.log("AUTO TRIGGER PREVIEW");
			showPreview();
		}, 3000);
		*/

		// Drum spin loop (separate from context for easy control)
		initDrumAnimation();
		return () => window.removeEventListener('click', debugClick);
	});

	let drumTween: gsap.core.Tween;

	function initDrumAnimation() {
		drumTween = gsap.to('.drum-spinner', {
			rotation: 360,
			duration: 2,
			repeat: -1,
			ease: 'none',
			paused: true
		});
	}

	let isPreviewOpen = $state(false);

	function showPreview() {
		console.log("SHOW PREVIEW TRIGGERED! 🚀"); // DEBUG LOG
		// if (!resultImage) return; // Allow preview for layout testing

		isPreviewOpen = true;

		// Move Camera forward (Zoom into background)
		gsap.to('.world-container', {
			z: 600, // Move camera forward (past zero point)
			y: 50, // Slight adjust for height
			duration: 2,
			ease: 'power4.inOut'
		});

		// Fade out machines so they don't clip weirdly as we pass through
		gsap.to('.machine-grid', {
			opacity: 0,
			duration: 1,
			delay: 0.5, // Start fading as we get close
			scale: 1.5 // Expand effect
		});
		
		// Ensure clothesline is fully visible/focused
		gsap.to('.drying-section', {
			scale: 1.2,
			duration: 2,
			ease: 'power4.inOut'
		});
	}

	function hidePreview() {
		isPreviewOpen = false;

		gsap.to('.world-container', { 
			z: 0, 
			y: 0,
			duration: 1.5, 
			ease: 'power4.inOut' 
		});
		
		gsap.to('.machine-grid', {
			opacity: 1,
			scale: 1,
			duration: 1.5,
			ease: 'power4.inOut'
		});

		gsap.to('.drying-section', {
			scale: 1,
			duration: 1.5
		});
	}

	onDestroy(() => {
		ctx?.revert();
		drumTween?.kill();
	});

	// Reactive Control
	$effect(() => {
		if (drumTween) {
			if (isProcessing) {
				gsap.to(drumTween, { 
					timeScale: 1, 
					duration: 1, 
					onStart: () => { drumTween.play(); } 
				});
			} else {
				gsap.to(drumTween, { 
					timeScale: 0, 
					duration: 1, 
					onComplete: () => { drumTween.pause(); } 
				});
			}
		}
	});

</script>

<div class="gsap-container" bind:this={containerRef}>
	<!-- Atmospheric Light -->
	<div class="spotlight"></div>

	<!-- Back Button (Only in preview) -->
	{#if isPreviewOpen}
		<button 
			class="back-btn" 
			onclick={hidePreview}
			in:fly={{ y: 20, duration: 500, delay: 1000 }}
		>
			← BACK TO LAUNDRY
		</button>
	{/if}

	<div class="scene-3d">
		<!-- Move everything into a world container we can pan -->
		<div class="world-container">
			
			<div class="machine-grid" class:no-pointer={isPreviewOpen}>
				<!-- Washer 1 (Left - Neighbor) -->
				<div class="machine-wrapper" style="--delay: 0s">
					<div class="machine-3d">
						<!-- LABEL -->
						{#if leftM?.occupantId}
							<div class="user-label">Occupied (P{leftM.id})</div>
						{/if}
						<div class="face front">
							<div class="panel">
								<!-- LED Status -->
								<div class="led" class:active={leftM?.status === 'washing'}></div>
								<div class="timer small">{leftM?.status === 'washing' ? 'WASH' : (leftM?.status === 'done' ? 'DONE' : 'IDLE')}</div>
							</div>
							<div class="door-frame">
								<div class="glass">
									<div class="drum-spinner" class:spinning={leftM?.status === 'washing'}>
										<!-- Content inside drum -->
										{#if leftM && (leftM.resultUrl || leftM.imageUrl)}
											<div class="image-content" style="background-image: url('{leftM.resultUrl || leftM.imageUrl}')"></div>
										{:else}
											<div class="clothes">
												<div class="cloth c1"></div>
												<div class="cloth c2"></div>
											</div>
										{/if}
									</div>
									<div class="reflection"></div>
								</div>
							</div>
						</div>
						<div class="face right"></div>
						<div class="face top"></div>
						<div class="face left"></div>
					</div>
				</div>

				<!-- Washer 2 (Center - Hero - ME) -->
				<div class="machine-wrapper hero" style="--delay: 0.2s">
					{#if !myMachineId}
						 <div class="user-label blink">WAITING FOR SLOT...</div>
					{:else}
						 <div class="user-label mine">YOU (Machine {myMachineId})</div>
					{/if}

					<div 
						class="machine-3d clickable" 
						role="button" 
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && showPreview()}
						onclick={showPreview}
					>
						<div class="face front">
							<div class="panel">
								<!-- Use centerM data -->
								<div class="led" class:active={centerM?.status === 'washing'}></div>
								
								<!-- Clickable Text only if it's MY machine -->
								{#if centerM?.occupantId === myMachineId}
									<div 
										class="timer clickable-text" 
										role="button" 
										tabindex="0"
										onkeydown={(e) => e.key === 'Enter' && showPreview()}
										onclick={(e) => { e.stopPropagation(); showPreview(); }}
									>
										{centerM?.status === 'washing' ? 'WASHING' : (centerM?.status === 'done' ? 'SEE RESULT' : 'READY')}
									</div>
								{:else}
									<div class="timer">OCCUPIED</div>
								{/if}
							</div>
							<div class="door-frame">
								<div class="glass">
									<div class="drum-spinner" class:spinning={centerM?.status === 'washing'}>
										<!-- Content inside drum -->
										{#if centerM && (centerM.resultUrl || centerM.imageUrl)}
											<div class="image-content" style="background-image: url('{centerM.resultUrl || centerM.imageUrl}')"></div>
										{:else}
											<div class="clothes">
												<div class="cloth c1"></div>
												<div class="cloth c2"></div>
												<div class="cloth c3"></div>
											</div>
										{/if}
									</div>
									<div class="reflection"></div>
								</div>
							</div>
						</div>
						<div class="face right"></div>
						<div class="face top"></div>
						<div class="face left"></div>
						<div class="shadow"></div>
					</div>
				</div>

				<!-- Washer 3 (Right - Neighbor) -->
				<div class="machine-wrapper" style="--delay: 0.4s">
					<div class="machine-3d">
						{#if rightM?.occupantId}
							<div class="user-label">Occupied (P{rightM.id})</div>
						{/if}
						<div class="face front">
							<div class="panel">
								<div class="led" class:active={rightM?.status === 'washing'}></div>
								<div class="timer small">{rightM?.status === 'washing' ? 'WASH' : (rightM?.status === 'done' ? 'DONE' : 'IDLE')}</div>
							</div>
							<div class="door-frame">
								<div class="glass">
									<div class="drum-spinner" class:spinning={rightM?.status === 'washing'}>
										{#if rightM && (rightM.resultUrl || rightM.imageUrl)}
											<div class="image-content" style="background-image: url('{rightM.resultUrl || rightM.imageUrl}')"></div>
										{:else}
											<div class="clothes">
												<div class="cloth c1"></div>
											</div>
										{/if}
									</div>
									<div class="reflection"></div>
								</div>
							</div>
						</div>
						<div class="face right"></div>
						<div class="face top"></div>
						<div class="face left"></div>
					</div>
				</div>
			</div>

			<!-- Clothesline Section (To the Right) -->
			<!-- Click to go back -->
			<div class="drying-section" onclick={hidePreview} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && hidePreview()}>
				<ClothesLine image={centerM?.resultUrl} />
			</div>

		</div>
	</div>
</div>

<style>
	.gsap-container {
		width: 100%;
		height: 100%;
		position: absolute;
		/* Fallback / Procedural Outdoor Background */
		background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #88c999 50%, #4CAF50 100%);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Add a 'blur' overlay to make it look like depth-of-field background */
	.gsap-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: inherit;
		filter: blur(20px) contrast(0.8) brightness(0.9);
		transform: scale(1.1); /* Remove white edges from blur */
		z-index: 0;
	}

	/* Add a vignette to focus on center */
	.gsap-container::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle, transparent 40%, rgba(0,0,0,0.3) 90%);
		pointer-events: none;
		z-index: 1;
	}

	.no-pointer {
		pointer-events: none !important;
	}

	.back-btn {
		position: absolute;
		top: 40px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
		padding: 10px 20px;
		border-radius: 30px;
		cursor: pointer;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		letter-spacing: 1px;
		transition: 0.3s;
		backdrop-filter: blur(5px);
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateX(-50%) translateY(-2px);
		box-shadow: 0 5px 15px rgba(0,0,0,0.3);
	}

	.scene-3d {
		perspective: 2000px;
		transform-style: preserve-3d;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.world-container {
		width: 100%;
		height: 100%;
		position: absolute; /* Stacked layout, not flex ROW */
		transform-style: preserve-3d;
		transition: transform 0s; /* Controlled by GSAP */
	}

	.machine-grid {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%); /* Center by default */
		display: flex;
		gap: 60px;
		transform-style: preserve-3d;
		z-index: 10;
	}

	.drying-section {
		position: absolute;
		top: 50%;
		left: 50%;
		/* Start far behind (-800px) and centered */
		transform: translate(-50%, -50%) translateZ(-800px); 
		cursor: zoom-out;
		transform-style: preserve-3d;
		z-index: 0;
	}

	.machine-wrapper {
		position: relative;
		width: 200px;
		height: 280px;
		transform-style: preserve-3d;
	}

	.machine-wrapper.hero {
		transform: scale(1.1) translateZ(50px);
		z-index: 10;
	}

	.machine-3d {
		width: 100%;
		height: 100%;
		position: relative;
		transform-style: preserve-3d;
	}

	/* CUBE FACES */
	.face {
		position: absolute;
		backface-visibility: hidden;
	}

	.front {
		width: 200px;
		height: 280px;
		background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d5 100%);
		transform: translateZ(50px);
		border-radius: 10px;
		border: 1px solid #fff;
		box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px;
	}

	.right {
		width: 100px;
		height: 280px;
		background: #aab;
		transform: rotateY(90deg) translateZ(150px);
		border-radius: 4px;
	}

	.left {
		width: 100px;
		height: 280px;
		background: #ccc;
		transform: rotateY(-90deg) translateZ(50px);
		border-radius: 4px;
	}

	.top {
		width: 200px;
		height: 100px;
		background: #fff;
		transform: rotateX(90deg) translateZ(50px);
		border-radius: 4px;
	}

	/* Machine Details */
	.panel {
		width: 100%;
		height: 40px;
		background: #333;
		border-radius: 4px;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 10px;
		box-shadow: 0 2px 5px rgba(0,0,0,0.3);
	}

	.led {
		width: 8px;
		height: 8px;
		background: #555;
		border-radius: 50%;
		transition: 0.3s;
	}

	.led.active {
		background: #0f0;
		box-shadow: 0 0 10px #0f0;
	}

	.timer {
		color: #0f0;
		font-family: monospace;
		font-size: 12px;
	}

	.clickable-text {
		cursor: pointer;
		pointer-events: auto;
		z-index: 100; /* Very High z-index */
		position: relative;
		transition: 0.2s;
		transform: translateZ(20px); /* Physically lift it off the panel */
		background: rgba(0,0,0,0.2); /* Hitbox visibility helper (subtle) */
		padding: 2px 5px;
		border-radius: 4px;
	}
	
	.clickable-text:hover {
		color: #fff;
		text-shadow: 0 0 5px #fff;
		background: rgba(0,0,0,0.5);
	}

	.shadow {
		position: absolute;
		bottom: -40px;
		left: 10px;
		width: 180px;
		height: 20px;
		background: rgba(0, 50, 20, 0.3); /* Green-ish shadow for grass */
		filter: blur(15px);
		transform: rotateX(90deg);
	}

	.spotlight {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		/* Warm sunlight from top-left */
		background: radial-gradient(circle at 30% 30%, rgba(255, 250, 240, 0.4) 0%, transparent 60%);
		pointer-events: none; /* CRITICAL: Allow clicks to pass through */
		z-index: 10;
		mix-blend-mode: overlay;
	}

	.door-frame {
		width: 140px;
		height: 140px;
		border-radius: 50%;
		background: #dcdcdc;
		border: 10px solid #bbb;
		box-shadow: 
			5px 5px 15px rgba(0,0,0,0.3),
			inset 2px 2px 5px rgba(255,255,255,0.8);
		position: relative;
		overflow: hidden;
	}

	.glass {
		width: 100%;
		height: 100%;
		background: #222;
		border-radius: 50%;
		box-shadow: inset 0 0 20px #000;
		position: relative;
		overflow: hidden;
	}

	.drum-spinner {
		width: 100%;
		height: 100%;
		position: relative;
		transform-origin: center;
	}

	.image-content {
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		border-radius: 50%;
		opacity: 0.9;
	}

	.reflection {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%);
		pointer-events: none;
		border-radius: 50%;
	}

	/* Decoration */
	.clothes {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.cloth {
		position: absolute;
		border-radius: 40%;
	}

	.c1 { width: 40px; height: 30px; background: #ff5555; top: 30px; left: 30px; }
	.c2 { width: 30px; height: 40px; background: #5555ff; bottom: 30px; right: 30px; }
	.c3 { width: 20px; height: 20px; background: #ffff55; top: 50%; left: 50%; transform: translate(-50%, -50%); }

	/* Shadow moved up to match lighting */

	.machine-3d.clickable {
		cursor: pointer;
		transition: transform 0.2s;
	}

	.machine-3d.clickable:hover {
		transform: scale(1.05); /* Quick pop on hover */
	}

	/* User Labels */
	.user-label {
		position: absolute;
		top: -40px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		padding: 4px 10px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 10px;
		letter-spacing: 1px;
		white-space: nowrap;
		border: 1px solid rgba(255, 255, 255, 0.2);
		z-index: 20;
	}

	.user-label.mine {
		background: #ff8844;
		color: #000;
		font-weight: bold;
		border: none;
		box-shadow: 0 0 10px rgba(255, 136, 68, 0.5);
	}

	.user-label.blink {
		animation: blink 1s infinite;
		background: #ff4444;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.timer.small {
		font-size: 10px;
		opacity: 0.7;
	}
	
	.drum-spinner.spinning {
		animation: spin 0.5s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
