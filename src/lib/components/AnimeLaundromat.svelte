<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import gsap from 'gsap';

	let {
		uploadedImage = null,
		resultImage = null,
		isProcessing = false
	}: {
		uploadedImage: string | null;
		resultImage: string | null;
		isProcessing: boolean;
	} = $props();

	let containerRef: HTMLDivElement;
	let ctx: gsap.Context;

	onMount(() => {
		ctx = gsap.context(() => {
			// Initial setup
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

		// Drum spin loop (separate from context for easy control)
		initDrumAnimation();
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

	<div class="scene-3d">
		<div class="machine-grid">
			<!-- Washer 1 (Left) -->
			<div class="machine-wrapper" style="--delay: 0s">
				<div class="machine-3d">
					<div class="face front">
						<div class="panel">
							<div class="led" class:active={isProcessing}></div>
						</div>
						<div class="door-frame">
							<div class="glass">
								<div class="drum-spinner">
									<!-- Content inside drum -->
									{#if resultImage || uploadedImage}
										<div class="image-content" style="background-image: url('{resultImage || uploadedImage}')"></div>
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

			<!-- Washer 2 (Center - Hero) -->
			<div class="machine-wrapper hero" style="--delay: 0.2s">
				<div class="machine-3d">
					<div class="face front">
						<div class="panel">
							<div class="led" class:active={isProcessing}></div>
							<div class="timer">{isProcessing ? 'WASHING' : 'READY'}</div>
						</div>
						<div class="door-frame">
							<div class="glass">
								<div class="drum-spinner">
									<!-- Content inside drum -->
									{#if resultImage || uploadedImage}
										<div class="image-content" style="background-image: url('{resultImage || uploadedImage}')"></div>
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

			<!-- Washer 3 (Right) -->
			<div class="machine-wrapper" style="--delay: 0.4s">
				<div class="machine-3d">
					<div class="face front">
						<div class="panel">
							<div class="led" class:active={isProcessing}></div>
						</div>
						<div class="door-frame">
							<div class="glass">
								<div class="drum-spinner">
									{#if resultImage || uploadedImage}
										<div class="image-content" style="background-image: url('{resultImage || uploadedImage}')"></div>
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
	</div>
</div>

<style>
	.gsap-container {
		width: 100%;
		height: 100%;
		position: absolute;
		background: #111;
		background: radial-gradient(circle at 50% 0%, #1a2a3a 0%, #050510 100%);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.scene-3d {
		perspective: 2000px;
		transform-style: preserve-3d;
	}

	.machine-grid {
		display: flex;
		gap: 60px;
		transform-style: preserve-3d;
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

	.shadow {
		position: absolute;
		bottom: -40px;
		left: 10px;
		width: 180px;
		height: 20px;
		background: rgba(0,0,0,0.4);
		filter: blur(10px);
		transform: rotateX(90deg);
	}
</style>
