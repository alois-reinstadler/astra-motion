import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { cdp, commands } from 'vitest/browser';
import { visualElementStore } from 'motion-dom';
import ProfileGrid from '../src/lib/motion-lab/ProfileGrid.svelte';
import Benchmark from '../src/lib/motion-lab/Benchmark.svelte';

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const variants = [
	'baseline',
	'upstream-3d',
	'sampler',
	'will-change',
	'contain-grid',
	'contain-items',
	'textless',
	'instant',
	'automatic',
	'explicit',
	'translate-2d'
] as const;
type Metrics = { metrics: { name: string; value: number }[] };
const metricMap = (data: Metrics) => new Map(data.metrics.map(({ name, value }) => [name, value]));

it('profiles repeated 500-participant reversals and rendering interventions', async () => {
	const session = cdp();
	await session.send('Performance.enable');
	const inspectLayers = import.meta.env.VITE_PROFILE_LAYERS === '1';
	let mutationCallbackMs = 0;
	let mutationRecords = 0;
	let mutationCallbacks = 0;
	const OriginalObserver = window.MutationObserver;
	window.MutationObserver = class extends OriginalObserver {
		constructor(callback: MutationCallback) {
			super((records, observer) => {
				const started = performance.now();
				callback(records, observer);
				mutationCallbackMs += performance.now() - started;
				mutationRecords += records.length;
				mutationCallbacks++;
			});
		}
	};
	let maximumLayers = 0;
	let maximumLayerArea = 0;
	const layerUpdate = (event: {
		layers?: { width: number; height: number; drawsContent: boolean }[];
	}) => {
		const layers = (event.layers ?? []).filter((layer) => layer.drawsContent);
		maximumLayers = Math.max(maximumLayers, layers.length);
		maximumLayerArea = Math.max(
			maximumLayerArea,
			layers.reduce((total, layer) => total + layer.width * layer.height, 0)
		);
	};
	session.on('LayerTree.layerTreeDidChange', layerUpdate);
	if (inspectLayers) await session.send('LayerTree.enable');
	const rows: Record<string, string | number | boolean>[] = [];
	const requested = import.meta.env.VITE_PROFILE_VARIANT as string | undefined;
	for (const variant of variants.filter((value) => !requested || requested === value)) {
		const view =
			variant === 'automatic' || variant === 'explicit'
				? await render(ProfileGrid, { count: 500, automatic: variant === 'automatic' })
				: await render(Benchmark, {
						count: 500,
						backend: variant === 'instant' ? 'instant' : 'motion'
					});
		const grid = document.querySelector<HTMLElement>('.benchmark-grid')!;
		const items = [...grid.children] as HTMLElement[];
		if (variant === 'will-change')
			items.forEach((item) => {
				item.style.willChange = 'transform';
			});
		if (variant === 'contain-grid') grid.style.contain = 'layout paint';
		if (variant === 'contain-items')
			items.forEach((item) => {
				item.style.contain = 'layout paint';
			});
		if (variant === 'upstream-3d')
			items.forEach((item) => {
				const visual = visualElementStore.get(item);
				visual?.update({ ...visual.getProps(), transformTemplate: undefined }, null);
			});
		if (variant === 'translate-2d')
			items.forEach((item) => {
				const visual = visualElementStore.get(item);
				visual?.update(
					{
						...visual.getProps(),
						transformTemplate: (_values, generated) =>
							generated.replace(/translate3d\(([^,]+), ([^,]+), 0px\)/g, 'translate($1, $2)')
					},
					null
				);
			});
		if (variant === 'textless')
			items.forEach((item) => {
				item.textContent = '';
			});
		await pause(400);
		for (let iteration = 0; iteration < 3; iteration++) {
			mutationCallbackMs = 0;
			mutationRecords = 0;
			mutationCallbacks = 0;
			maximumLayers = 0;
			maximumLayerArea = 0;
			const frames: number[] = [];
			const animationSamples: number[] = [];
			let previous = 0;
			let raf: number;
			const sample = (time: number) => {
				if (previous) frames.push(time - previous);
				previous = time;
				if (variant === 'sampler') animationSamples.push(view.component.stats().active);
				raf = requestAnimationFrame(sample);
			};
			let boundsReads = 0;
			const originalBounds = Element.prototype.getBoundingClientRect;
			if (variant === 'sampler' || variant === 'automatic' || variant === 'explicit')
				Element.prototype.getBoundingClientRect = function () {
					boundsReads++;
					return originalBounds.call(this);
				};
			raf = requestAnimationFrame(sample);
			await frame();
			const before = metricMap((await session.send('Performance.getMetrics')) as Metrics);
			const started = performance.now();
			view.component.reorder();
			const transactionMs = performance.now() - started;
			await pause(950);
			const after = metricMap((await session.send('Performance.getMetrics')) as Metrics);
			cancelAnimationFrame(raf);
			Element.prototype.getBoundingClientRect = originalBounds;
			const projection = visualElementStore.get(items[0])?.projection;
			const row: Record<string, string | number | boolean> = {
				variant,
				iteration,
				transactionMs,
				boundsReads,
				mutationCallbackMs,
				mutationRecords,
				mutationCallbacks,
				maximumLayers,
				maximumLayerArea,
				frameCount: frames.length,
				maxFrameMs: Math.max(...frames),
				framesOver25ms: frames.filter((interval) => interval > 25).length,
				activeAtSettle: view.component.stats().active,
				nativeAnimations: document.getAnimations().length,
				documentVisibility: document.visibilityState,
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight,
				gridWidth: grid.offsetWidth,
				gridHeight: grid.offsetHeight,
				resizeBlocked: projection?.root?.isUpdateBlocked() ?? false,
				sampledPeakActive: animationSamples.length ? Math.max(...animationSamples) : -1
			};
			for (const key of [
				'LayoutCount',
				'RecalcStyleCount',
				'LayoutDuration',
				'RecalcStyleDuration',
				'ScriptDuration',
				'TaskDuration'
			]) {
				row[key] = (after.get(key) ?? 0) - (before.get(key) ?? 0);
			}
			rows.push(row);
			expect(view.component.stats().active).toBe(0);
		}
		await view.unmount();
		await frame();
	}
	window.MutationObserver = OriginalObserver;
	session.off('LayerTree.layerTreeDidChange', layerUpdate);
	if (inspectLayers) await session.send('LayerTree.disable');
	await commands.writeFile(
		`docs/research/performance-profile-500${requested ? `-${requested}${inspectLayers ? '-layers' : '-observer'}` : ''}${import.meta.env.VITE_PERFORMANCE_SUFFIX ?? ''}.json`,
		JSON.stringify(
			{
				date: new Date().toISOString(),
				browser: navigator.userAgent,
				viewport: '1280x720',
				workload:
					'500 nodes; three reversals per mount; no animation seeking; native animation count sampled at settle only; first reversal cold, subsequent warm; dev-mode Vitest',
				rows
			},
			null,
			2
		)
	);
}, 60000);
