<script lang="ts">
	import { onMount } from 'svelte';
	import gsap from 'gsap';

	let { image = null } = $props<{ image: string | null }>();

	$effect(() => {
		let ctx: gsap.Context;
		let timer: ReturnType<typeof setTimeout> | undefined;

		if (image) {
			timer = setTimeout(() => {
				ctx = gsap.context(() => {
					// 1. Pendulum Sway (Gravity vs Wind) - Slow & Large
					gsap.to('.drying-cloth-3d', {
						rotationZ: 'random(-5, 5)',
						duration: 'random(2, 4)',
						repeat: -1,
						yoyo: true,
						ease: 'sine.inOut'
					});

					// 2. Billowing (Wind Pressure) - Lifts the cloth up
					gsap.to('.drying-cloth-3d', {
						rotationX: 'random(10, 30)', // Lift up significantly
						duration: 'random(1, 2)',
						repeat: -1,
						yoyo: true,
						ease: 'power1.inOut'
					});

					// 3. Flutter (Turbulence) - Fast Jitter
					gsap.to('.drying-cloth-3d', {
						skewX: 'random(-5, 5)', // Cloth distorting
						duration: 'random(0.1, 0.3)',
						repeat: -1,
						yoyo: true,
						ease: 'sine.inOut'
					});

					// 4. Subtle Twist (Variance)
					gsap.to('.drying-cloth-3d', {
						rotationY: 'random(-10, 10)',
						duration: 'random(2, 5)',
						repeat: -1,
						yoyo: true,
						ease: 'sine.inOut'
					});
				});
			}, 100);
		}

		return () => {
			if (timer) clearTimeout(timer);
			if (ctx) ctx.revert(); // Clean up all GSAP animations at once
		};
	});
</script>

<div class="clothesline-3d">
	<!-- Left Pole -->
	<div class="pole left-pole"></div>
	
	<!-- Right Pole -->
	<div class="pole right-pole"></div>
	
	<!-- The Line -->
	<div class="rope"></div>

	<!-- Hanging Item -->
	{#if image}
		<div class="hanging-wrapper">
			<div class="clothespin p1"></div>
			<div class="clothespin p2"></div>
			<div class="drying-cloth-3d">
				<div class="cloth-face front" style="background-image: url('{image}')"></div>
				<div class="cloth-face back" style="background-image: url('{image}')"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.clothesline-3d {
		width: 300px;
		height: 400px;
		position: relative;
		transform-style: preserve-3d;
	}

	.pole {
		position: absolute;
		bottom: 0;
		width: 10px;
		height: 350px;
		background: #8d6e63;
		transform-style: preserve-3d;
		box-shadow: inset 2px 0 5px rgba(0,0,0,0.5);
	}
	/* Add thickness to poles */
	.pole::after {
		content: '';
		position: absolute;
		left: 10px;
		width: 10px;
		height: 100%;
		background: #6d4c41;
		transform: rotateY(90deg);
		transform-origin: left;
	}

	.left-pole { left: 0; }
	.right-pole { right: 0; }

	.rope {
		position: absolute;
		top: 50px;
		left: 5px;
		right: 5px;
		height: 2px;
		background: #ddd;
		transform: translateZ(5px);
		box-shadow: 0 2px 2px rgba(0,0,0,0.2);
	}

	.hanging-wrapper {
		position: absolute;
		top: 50px;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 260px;
		transform-style: preserve-3d;
		transform-origin: top center;
	}

	.drying-cloth-3d {
		width: 100%;
		height: 100%;
		position: relative;
		transform-origin: top center;
		transform-style: preserve-3d;
		transition: transform 0.1s; /* smoothed by gsap */
	}

	.cloth-face {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		background-color: #fff;
		backface-visibility: hidden;
		border-radius: 4px;
		box-shadow: 0 5px 15px rgba(0,0,0,0.2);
	}

	.back {
		transform: rotateY(180deg);
		filter: brightness(0.9); /* Slightly darker back */
	}

	.clothespin {
		position: absolute;
		top: -10px;
		width: 8px;
		height: 25px;
		background: #d4a373;
		z-index: 10;
	}
	
	.p1 { left: 20%; }
	.p2 { right: 20%; }
</style>
