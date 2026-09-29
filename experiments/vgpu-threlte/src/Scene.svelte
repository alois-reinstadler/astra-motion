<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { T, useThrelte } from '@threlte/core';
	import { animate, frame, cancelFrame } from 'motion';
	import { threeEffect } from 'motion/three';
	import { fragmentShader, vertexShader, type DemoController } from './shaders';
	let {
		ready,
		driver
	}: { ready: (value: DemoController | null) => void; driver: 'svelte' | 'motion' } = $props();
	const { invalidate } = useThrelte();
	const tween = new Tween({ progress: 0, intensity: 0.25 }, { duration: 1200, easing: cubicInOut });
	const uniforms = { progress: { value: 0 }, intensity: { value: 0.25 } };
	let writes = 0;
	let playback: ReturnType<typeof animate> | undefined;
	let activeDriver: 'svelte' | 'motion' = 'svelte';
	$effect(() => {
		const value = tween.current;
		if (activeDriver === 'svelte') {
			uniforms.progress.value = value.progress;
			uniforms.intensity.value = value.intensity;
			writes++;
			invalidate();
		}
	});
	onMount(() => {
		animate.addEffect(threeEffect);
		// Run after Motion's preRender writes, then request Threlte's on-demand render.
		const render = () => {
			writes++;
			invalidate();
		};
		const stop = () => {
			playback?.stop();
			cancelFrame(render);
			void tween.set(tween.current, { duration: 0 });
			frame.render(render);
		};
		ready({
			play(value, reduced) {
				stop();
				activeDriver = driver;
				if (driver === 'motion') {
					playback = animate(
						uniforms,
						{ progress: value, intensity: value ? 1 : 0.25 },
						{ duration: reduced ? 0 : 1.2, ease: 'easeInOut', onUpdate: () => frame.render(render) }
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
					writes,
					driver: activeDriver,
					backend: 'WebGL2'
				};
			}
		});
		return () => {
			stop();
			cancelFrame(render);
			ready(null);
		};
	});
</script>

<T.Mesh frustumCulled={false}>
	<T.PlaneGeometry args={[2, 2]} />
	<T.ShaderMaterial {uniforms} {vertexShader} {fragmentShader} toneMapped={false} />
</T.Mesh>
