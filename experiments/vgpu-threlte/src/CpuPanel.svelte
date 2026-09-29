<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { animate, frame, cancelFrame } from 'motion';
	import { threeEffect } from 'motion/three';
	import type { DemoController } from './shaders';
	let {
		ready,
		driver
	}: { ready: (value: DemoController | null) => void; driver: 'svelte' | 'motion' } = $props();
	const tween = new Tween({ progress: 0, intensity: 0.25 }, { duration: 1200, easing: cubicInOut });
	const uniforms = { progress: { value: 0 }, intensity: { value: 0.25 } };
	let activeDriver: 'svelte' | 'motion' = 'svelte';
	let draw = () => {};
	$effect(() => {
		const value = tween.current;
		if (activeDriver === 'svelte') {
			uniforms.progress.value = value.progress;
			uniforms.intensity.value = value.intensity;
			frame.render(draw);
		}
	});
	function attach(canvas: HTMLCanvasElement) {
		const context = canvas.getContext('2d')!;
		const image = context.createImageData(canvas.width, canvas.height);
		let draws = 0;
		let playback: ReturnType<typeof animate> | undefined;
		draw = () => {
			for (let y = 0; y < canvas.height; y++)
				for (let x = 0; x < canvas.width; x++) {
					const radius = Math.hypot((x / canvas.width) * 2 - 1, (y / canvas.height) * 2 - 1);
					const ripple = 0.5 + 0.5 * Math.sin(radius * 18 - uniforms.progress.value * 12);
					const t = Math.max(0, Math.min(1, (ripple - 0.2) / 0.6));
					const band = t * t * (3 - 2 * t) * uniforms.intensity.value;
					const offset = (y * canvas.width + x) * 4;
					image.data[offset] = (0.035 + (0.25 - 0.035) * band) * 255;
					image.data[offset + 1] = (0.055 + (0.85 - 0.055) * band) * 255;
					image.data[offset + 2] = (0.12 + (0.7 - 0.12) * band) * 255;
					image.data[offset + 3] = 255;
				}
			context.putImageData(image, 0, 0);
			draws++;
		};
		draw();
		animate.addEffect(threeEffect);
		const stop = () => {
			playback?.stop();
			void tween.set(tween.current, { duration: 0 });
			cancelFrame(draw);
			frame.render(draw);
		};
		ready({
			play(value, reduced) {
				stop();
				activeDriver = driver;
				if (driver === 'motion') {
					playback = animate(
						uniforms,
						{ progress: value, intensity: value ? 1 : 0.25 },
						{ duration: reduced ? 0 : 1.2, ease: 'easeInOut', onUpdate: () => frame.render(draw) }
					);
				} else {
					void tween.set(
						{ progress: uniforms.progress.value, intensity: uniforms.intensity.value },
						{ duration: 0 }
					);
					void tween.set(
						{ progress: value, intensity: value ? 1 : 0.25 },
						{ duration: reduced ? 0 : 1200 }
					);
				}
			},
			stop,
			snapshot() {
				return {
					progress: uniforms.progress.value,
					intensity: uniforms.intensity.value,
					draws,
					driver: activeDriver,
					backend: 'Canvas2D reference (not GPU / not Threlte)'
				};
			}
		});
		return () => {
			stop();
			cancelFrame(draw);
			ready(null);
		};
	}
</script>

<div class="viewport">
	<canvas
		width="320"
		height="180"
		aria-label="Explicit CPU reference of the ripple shader"
		{@attach attach}
	></canvas><span>CANVAS 2D REFERENCE</span>
</div>

<style>
	.viewport {
		position: relative;
		aspect-ratio: 16/9;
	}
	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}
	span {
		position: absolute;
		bottom: 10px;
		left: 10px;
		color: #e4edf4;
		background: #080d16dd;
		padding: 5px 8px;
		font:
			0.65rem ui-monospace,
			monospace;
	}
</style>
