<script lang="ts">
	import { animate, frame, cancelFrame } from 'motion';
	import { vgpuEffect } from 'motion/vgpu';
	import type { DemoController } from './shaders';
	import { wgsl } from './shaders';
	let {
		ready,
		report
	}: { ready: (value: DemoController | null) => void; report: (message: string) => void } =
		$props();
	let status = $state('Checking WebGPU…');
	function attach(canvas: HTMLCanvasElement) {
		let disposed = false;
		let cleanup = () => {};
		async function start() {
			if (!navigator.gpu) {
				status = 'WebGPU unavailable in this context';
				report(status);
				return;
			}
			const adapter = await navigator.gpu.requestAdapter();
			if (!adapter || disposed) {
				if (!disposed) {
					status = 'No WebGPU adapter available';
					report(status);
				}
				return;
			}
			const { init, effect, surface, frame: gpuFrame } = await import('vgpu');
			if (disposed) return;
			const gpu = await init();
			if (disposed) {
				gpu.dispose();
				return;
			}
			cleanup = () => {
				ready(null);
				gpu.dispose();
			};
			const target = surface(gpu, canvas, { size: [640, 360], autoResize: false, dpr: 1 });
			const shader = effect(gpu, wgsl, { set: { params: { progress: 0, intensity: 0.25 } } });
			let writes = 0;
			let draws = 0;
			let current = 0;
			let strength = 0.25;
			let playback: ReturnType<typeof animate> | undefined;
			const draw = () => {
				if (!disposed) {
					gpuFrame(gpu, (f) => f.pass(target, shader));
					draws++;
				}
			};
			// Instrument the actual shader, keeping its identity for Motion's effect detection.
			const set = shader.set.bind(shader);
			shader.set = (bag) => {
				writes++;
				const params = bag.params as { progress?: number; intensity?: number };
				current = params.progress ?? current;
				strength = params.intensity ?? strength;
				set(bag);
				frame.render(draw);
				return shader;
			};
			animate.addEffect(vgpuEffect);
			draw();
			ready({
				play(value, reduced) {
					playback?.stop();
					playback = animate(
						shader,
						{
							'params.progress': [current, value],
							'params.intensity': [strength, value ? 1 : 0.25]
						},
						{ duration: reduced ? 0 : 1.2, ease: 'easeInOut' }
					);
				},
				stop() {
					playback?.stop();
				},
				snapshot() {
					return { progress: current, intensity: strength, writes, draws, backend: 'WebGPU' };
				}
			});
			status = 'WebGPU ready · renders only on changes';
			report(status);
			cleanup = () => {
				playback?.stop();
				cancelFrame(draw);
				ready(null);
				gpu.dispose();
			};
		}
		start().catch((error: unknown) => {
			cleanup();
			if (!disposed) {
				status = `Unavailable: ${error instanceof Error ? error.message : String(error)}`;
				report(status);
			}
		});
		return () => {
			disposed = true;
			cleanup();
		};
	}
</script>

<div class="viewport">
	<canvas width="640" height="360" aria-label="vgpu two-dimensional ripple shader" {@attach attach}
	></canvas>
</div>
<p class="status" data-testid="vgpu-status">{status}</p>

<style>
	.viewport {
		aspect-ratio: 16/9;
		background: #0b1021;
	}
	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}
	.status {
		font-size: 0.8rem;
		color: #a9b9c9;
	}
</style>
