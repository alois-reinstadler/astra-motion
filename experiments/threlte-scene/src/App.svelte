<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas } from '@threlte/core';
	import {
		motion,
		motionStore,
		useMotionValue,
		useReducedMotion,
		useScroll,
		useSpring,
		useTransform
	} from 'astra-motion';
	import Scene from './Scene.svelte';
	import { chapterAt, pointerPosition, scenePose } from './scene-path.mjs';

	const chapters = [
		{
			id: 'arrival',
			number: '01',
			label: 'The whole world',
			eyebrow: 'A city, in miniature',
			title: ['Small city.', 'Endless stories.'],
			description:
				'A train rounds the corner. Neon signs crowd the sky. Somewhere in this little world, life is moving.',
			note: 'Scroll to take the long way around.'
		},
		{
			id: 'streets',
			number: '02',
			label: 'A closer look',
			eyebrow: 'Every corner has a character',
			title: ['Find the', 'unexpected.'],
			description:
				'Follow the tracks past tangled cables, tiny balconies, and a very large panda. Change your perspective. Notice something new.',
			note: 'Move your cursor to lean into the scene.'
		},
		{
			id: 'perspective',
			number: '03',
			label: 'Another perspective',
			eyebrow: 'Same place. Different point of view.',
			title: ['Take your', 'time here.'],
			description:
				'A small world rewards a second look. Scroll back, follow another detail, and see where it takes you.',
			note: 'A miniature by glenatron. Reimagined in Svelte.'
		}
	];
	const preference = useReducedMotion();
	let still = $state(false);
	const quiet = $derived(Boolean(preference.current) || still);
	const { scrollYProgress } = useScroll();
	const scroll = useSpring(scrollYProgress, {
		stiffness: 115,
		damping: 27,
		mass: 0.7,
		skipInitialAnimation: true
	});
	const pointerX = useMotionValue(0);
	const pointerY = useMotionValue(0);
	const leanX = useSpring(pointerX, { stiffness: 100, damping: 23 });
	const leanY = useSpring(pointerY, { stiffness: 100, damping: 23 });
	const pose = useTransform(() =>
		quiet ? scenePose(0, 0, 0, true) : scenePose(scroll.get(), leanX.get(), leanY.get())
	);
	const progress = motionStore(scrollYProgress);
	const poseState = motionStore(pose);
	const chapter = $derived(chapterAt($progress));
	const progressBar = motion.bind({
		initial: false,
		style: { scaleX: scrollYProgress, originX: 0 }
	});
	const rotation = useTransform(scrollYProgress, [0, 1], [0, 120]);
	const ornament = motion.bind(() => ({ initial: false, style: { rotate: quiet ? 0 : rotation } }));
	let capability = $state<'checking' | 'available' | 'unavailable'>('checking');
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let errorDetail = $state('');
	let showScene = $state(true);
	const rendererLabel = $derived(
		!showScene
			? '3D paused · reference image'
			: capability === 'unavailable'
				? 'Reference image · WebGL2 unavailable'
				: status === 'error'
					? 'Reference image · scene failed'
					: status === 'ready'
						? 'WebGL2 · live 3D'
						: 'Preparing the city'
	);

	onMount(() => {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2');
		capability = gl ? 'available' : 'unavailable';
		gl?.getExtension('WEBGL_lose_context')?.loseContext();
	});
	function movePointer(event: PointerEvent) {
		if (quiet || event.pointerType !== 'mouse') return;
		const [x, y] = pointerPosition(event.clientX, event.clientY, {
			left: 0,
			top: 0,
			width: window.innerWidth,
			height: window.innerHeight
		});
		pointerX.set(x);
		pointerY.set(y);
	}
	function look(x: number) {
		if (!quiet) {
			pointerX.set(x);
			pointerY.set(0);
		}
	}
	function sceneStatus(next: 'ready' | 'error', detail = '') {
		status = next;
		errorDetail = detail;
	}
</script>

<svelte:window onpointermove={movePointer} onblur={() => look(0)} />
<a class="skip" href="#arrival">Skip to the story</a>
<header class="masthead">
	<a class="wordmark" href="#arrival" aria-label="Astra field notes, return to start"
		>astra<span class="asterisk">✳</span><span class="edition">FIELD NOTES / 001</span></a
	>
	<div class="header-right">
		<span class="location">35°40′ N &nbsp; 139°45′ E</span><button
			class="quiet-button"
			aria-pressed={quiet}
			disabled={Boolean(preference.current)}
			onclick={() => (still = !still)}
			>{preference.current ? 'Reduced motion' : still ? 'Still view' : 'Motion on'}<span
				aria-hidden="true">{quiet ? '○' : '◉'}</span
			></button
		>
	</div>
</header>

<div
	class="scene-window"
	aria-hidden="true"
	data-renderer={rendererLabel}
	data-progress={$progress.toFixed(4)}
	data-camera={JSON.stringify($poseState.position)}
	data-clip={$poseState.clipFraction.toFixed(4)}
	data-quiet={quiet}
>
	<div class="scene-halo"></div>
	{#if capability === 'available' && status !== 'error' && showScene}
		<Canvas renderMode="on-demand" dpr={[1, 1.75]} shadows
			><Scene {pose} onstatus={sceneStatus} /></Canvas
		>
	{:else}
		<img class="source-poster" src="/assets/source-poster.webp" alt="" />
	{/if}
	<span class="scene-coordinate coordinate-top">TOKYO / A SMALL WORLD</span>
	<span class="scene-coordinate coordinate-bottom">AN EXPERIMENT IN PERSPECTIVE</span>
	<span class="crop crop-one"></span><span class="crop crop-two"></span>
</div>
<div class="renderer-status" role="status">
	<span class:live={status === 'ready' && showScene}></span>{rendererLabel}
</div>

<main>
	{#each chapters as item, index (item.id)}
		<section id={item.id} class="chapter" aria-labelledby={`${item.id}-title`}>
			<div class="chapter-copy">
				<p class="eyebrow"><span>{item.number} / 03</span> {item.eyebrow}</p>
				<svelte:element this={index === 0 ? 'h1' : 'h2'} class="scene-title" id={`${item.id}-title`}
					>{item.title[0]}<br /><em>{item.title[1]}</em></svelte:element
				>
				<p class="description">{item.description}</p>
				<p class="chapter-note">
					<span aria-hidden="true">{index === 0 ? '↓' : index === 1 ? '↔' : '↑'}</span>{item.note}
				</p>
				{#if index === 0}<a class="explore-link" href="#streets"
						>Explore the city <span aria-hidden="true">↗</span></a
					>{/if}
				{#if index === 2}
					<details class="credits">
						<summary>About this scene & credits</summary>
						<p>
							A port of <a href="https://pmndrs.github.io/examples/scrollcontrols-gltf/"
								>Paul Henschel’s R3F scene</a
							>. Camera orbit and scroll-scrubbed animation preserved; cursor movement, lighting and
							this story are additions.
						</p>
						<p>
							<a href="https://sketchfab.com/models/94b24a60dc1b48248de50bf087c0f042"
								>Littlest Tokyo by glenatron</a
							>
							· <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Rendered with
							Threlte / Three.js; choreographed with Astra Motion.
						</p>
						<p>
							Static reference image: Paul Henschel / pmndrs, from the original scene. Model credit
							and license above apply.
						</p>
						<p>
							{rendererLabel}. {capability === 'unavailable'
								? 'This browser cannot create a WebGL2 context. The image is a static reference from the original scene, not rendered 3D.'
								: 'The 3D scene renders on demand when its camera or animation changes.'}
						</p>
						{#if errorDetail}<p>Scene error: {errorDetail}</p>{/if}<a
							href="/assets/littlest-tokyo.glb"
							download>Download the credited source model</a
						>
					</details>
				{/if}
			</div>
		</section>
	{/each}
</main>

<aside class="scene-controls" aria-label="Scene view controls">
	<div class="look-controls">
		<button aria-label="Look left" disabled={quiet} onclick={() => look(-1)}>←</button><button
			aria-label="Center view"
			disabled={quiet}
			onclick={() => look(0)}>○</button
		><button aria-label="Look right" disabled={quiet} onclick={() => look(1)}>→</button>
	</div>
	{#if capability === 'available'}<button
			class="pause-scene"
			onclick={() => {
				showScene = !showScene;
				if (showScene) status = 'loading';
			}}>{showScene ? 'Pause 3D' : 'Load 3D'}</button
		>{/if}
	<span class="view-hint"
		>{quiet ? 'Still view · scroll to read' : 'Scroll to explore / move to look'}</span
	>
</aside>
<nav class="chapter-nav" aria-label="Story chapters">
	<div class="track"><div class="fill" {...progressBar.props}></div></div>
	<div class="chapter-links">
		{#each chapters as item, index (item.id)}<a
				href={`#${item.id}`}
				aria-current={chapter === index ? 'step' : undefined}
				><span>{item.number}</span><span>{item.label}</span></a
			>{/each}
	</div>
</nav>
<div class="signature" aria-hidden="true">
	<span {...ornament.props}>✳</span><span>Little things.<br />A different perspective.</span>
</div>
