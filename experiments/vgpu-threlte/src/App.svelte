<script lang="ts">
	import { onMount } from 'svelte';
	import CpuPanel from './CpuPanel.svelte';
	import { Canvas } from '@threlte/core';
	import { prefersReducedMotion } from 'svelte/motion';
	import VgpuPanel from './VgpuPanel.svelte';
	import Scene from './Scene.svelte';
	import type { DemoController } from './shaders';
	let mounted = $state(true);
	let webgl = $state(false);
	let checked = $state(false);
	onMount(() => {
		const probe = document.createElement('canvas');
		const context = probe.getContext('webgl2');
		webgl = !!context;
		context?.getExtension('WEBGL_lose_context')?.loseContext();
		checked = true;
	});
	let driver = $state<'svelte' | 'motion'>('svelte');
	let target = $state(0);
	let reduced = $state(false);
	let gpuStatus = $state('Checking');
	let snapshot = $state('Press Inspect to read actual shader values and write counts.');
	let gpu: DemoController | null = null;
	let threlte: DemoController | null = null;
	function play(value: number) {
		target = value;
		const instant = reduced || prefersReducedMotion.current;
		gpu?.play(value, instant);
		threlte?.play(value, instant);
	}
	function inspect() {
		snapshot = JSON.stringify(
			{
				vgpu: gpu?.snapshot() ?? { status: gpuStatus },
				threlte: threlte?.snapshot() ?? { status: 'unmounted' }
			},
			null,
			2
		);
	}
	function toggle() {
		mounted = !mounted;
		target = 0;
	}
</script>

<svelte:head
	><meta
		name="description"
		content="Isolated vgpu, Motion and Threlte shader animation comparison."
	/></svelte:head
>
<main>
	<header>
		<span class="eyebrow">ASTRA / RESEARCH 01</span>
		<h1>One effect.<br /><em>Three ways to drive it.</em></h1>
		<p>
			A 2D ripple field tests the useful overlap: shader uniforms, interruption and ownership. This
			is an integration study, not a GPU speed benchmark.
		</p>
	</header>
	<section class="controls" aria-label="Experiment controls">
		<button onclick={() => play(target ? 0 : 1)} disabled={!mounted}>Animate / reverse</button>
		<button
			class="secondary"
			onclick={() => {
				gpu?.stop();
				threlte?.stop();
				inspect();
			}}
			disabled={!mounted}>Stop</button
		>
		<button class="secondary" onclick={toggle}
			>{mounted ? 'Unmount renderers' : 'Mount renderers'}</button
		>
		<button class="secondary" onclick={inspect}>Inspect</button>
		<label><input type="checkbox" bind:checked={reduced} /> Instant / reduced motion</label>
	</section>
	<div class="grid">
		<article>
			<span class="number">01 / DIRECT</span>
			<h2>vgpu + Motion</h2>
			<p>
				WGSL fullscreen shader. Two animated fields share one batched <code>set()</code> call per frame.
			</p>
			{#if mounted}<VgpuPanel
					ready={(value) => {
						gpu = value;
					}}
					report={(value) => {
						gpuStatus = value;
					}}
				/>{:else}<div class="empty">Renderer disposed</div>{/if}
		</article>
		<article>
			<span class="number">02 / EXISTING ECOSYSTEM</span>
			<h2>Threlte + Three.js</h2>
			<p>
				The same field in GLSL. Compare native Svelte animation with Motion's existing Three.js
				effect.
			</p>
			<label class="select"
				>Animation driver <select bind:value={driver} onchange={() => threlte?.stop()}
					><option value="svelte">Svelte Tween baseline</option><option value="motion"
						>Motion threeEffect</option
					></select
				></label
			>{#if mounted}{#if checked && webgl}<div class="viewport">
						<Canvas renderMode="on-demand" dpr={1}
							><Scene
								{driver}
								ready={(value) => {
									threlte = value;
								}}
							/></Canvas
						>
					</div>{:else if checked}<CpuPanel
						{driver}
						ready={(value) => {
							threlte = value;
						}}
					/>{:else}<div class="empty">Checking WebGL2…</div>{/if}{:else}<div class="empty">
					Renderer disposed
				</div>{/if}
			<p class="status">
				{webgl
					? 'WebGL2 · Threlte owns resources and rendering'
					: 'WebGL2 unavailable · explicit Canvas2D reference, not Threlte rendering'}
			</p>
		</article>
	</div>
	<section class="findings">
		<div>
			<h2>What this can establish</h2>
			<p>
				Motion provides one animation vocabulary across DOM, uniforms and scene objects. Threlte
				already supplies declarative ownership, disposal and render scheduling. Simple scalar
				animation needs no new adapter.
			</p>
			<p>
				WebGPU requires a supported adapter and a secure context. The tailnet HTTP preview may
				report it unavailable; the explicit Canvas2D reference remains usable when WebGL2 is also
				unavailable. No substitute canvas is presented as vgpu.
			</p>
		</div>
		<div>
			<h2>Live inspection</h2>
			<pre data-testid="inspection">{snapshot}</pre>
		</div>
	</section>
	<footer>
		Experimental dependencies are isolated. No Astra core API or rendering-speed claim is implied.
	</footer>
</main>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		background: #080d16;
		color: #e4edf4;
		font-family: Inter, ui-sans-serif, system-ui, sans-serif;
	}
	:global(button),
	:global(select),
	:global(input) {
		font: inherit;
	}
	main {
		max-width: 1280px;
		margin: auto;
		padding: 64px 32px 24px;
	}
	header {
		max-width: 790px;
	}
	.eyebrow,
	.number {
		font:
			0.72rem ui-monospace,
			monospace;
		letter-spacing: 0.14em;
		color: #7bdfbd;
	}
	h1 {
		font-size: clamp(2.5rem, 5vw, 4.8rem);
		line-height: 1.05;
		letter-spacing: -0.05em;
		margin: 22px 0;
		font-weight: 500;
	}
	em {
		color: #7bdfbd;
		font-style: normal;
	}
	p {
		line-height: 1.65;
		color: #a9b9c9;
	}
	header p {
		max-width: 620px;
	}
	.controls {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		align-items: center;
		margin: 32px 0;
	}
	button {
		border: 1px solid #7bdfbd;
		background: #7bdfbd;
		color: #071911;
		border-radius: 7px;
		padding: 10px 14px;
		cursor: pointer;
	}
	button.secondary {
		color: #d8e5ee;
		background: transparent;
		border-color: #34404f;
	}
	button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	label {
		color: #acbecb;
		font-size: 0.82rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}
	article {
		border: 1px solid #283440;
		border-radius: 12px;
		padding: 24px;
		background: #101721;
	}
	h2 {
		font-size: 1.35rem;
		font-weight: 500;
		letter-spacing: -0.025em;
	}
	article p {
		font-size: 0.9rem;
		min-height: 48px;
	}
	.viewport,
	.empty {
		aspect-ratio: 16/9;
		background: #0b1021;
	}
	.empty {
		display: grid;
		place-items: center;
		color: #acbecb;
	}
	.select {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		margin: 0 0 12px;
	}
	select {
		background: #172230;
		border: 1px solid #34404f;
		border-radius: 4px;
		padding: 6px;
		color: #e4edf4;
	}
	.status {
		font-size: 0.8rem;
	}
	.findings {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 48px;
		margin: 32px 0;
	}
	pre {
		background: #101721;
		padding: 20px;
		border-radius: 8px;
		white-space: pre-wrap;
		font-size: 0.8rem;
		line-height: 1.6;
		color: #7bdfbd;
	}
	footer {
		padding: 24px 0;
		border-top: 1px solid #283440;
		color: #7a91a3;
		font-size: 0.78rem;
	}
	@media (max-width: 760px) {
		main {
			padding: 32px 18px;
		}
		.grid,
		.findings {
			grid-template-columns: 1fr;
		}
		article {
			padding: 18px;
		}
	}
</style>
