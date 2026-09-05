import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { cdp, commands, server } from 'vitest/browser';
import Benchmark from './Benchmark.svelte';

type Metrics = { metrics: { name: string; value: number }[] };
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const metricsToMap = (data: Metrics) =>
	new Map(data.metrics.map(({ name, value }) => [name, value]));

it('records actual read counts, frame intervals and Chromium engine metrics', async () => {
	const rows: Record<string, number | string>[] = [];
	const session = server.browser === 'chromium' ? cdp() : undefined;
	await session?.send('Performance.enable');
	for (const [count, backend] of [
		[1, 'motion'],
		[10, 'motion'],
		[100, 'motion'],
		[500, 'motion'],
		[500, 'instant']
	] as const) {
		const view = await render(Benchmark, { count, backend });
		await pause(300);
		let boundsReads = 0;
		let styleReads = 0;
		const bounds = Element.prototype.getBoundingClientRect;
		const computed = window.getComputedStyle;
		Element.prototype.getBoundingClientRect = function () {
			boundsReads++;
			return bounds.call(this);
		};
		window.getComputedStyle = (...args) => {
			styleReads++;
			return computed(...args);
		};
		const frames: number[] = [];
		let peakActive = 0;
		let forcedStyleLayoutMsInLongFrames = 0;
		let longFrames = 0;
		const longFrameSupported =
			PerformanceObserver.supportedEntryTypes.includes('long-animation-frame');
		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				longFrames++;
				const timing = entry as PerformanceEntry & {
					scripts?: { forcedStyleAndLayoutDuration?: number }[];
				};
				for (const script of timing.scripts ?? [])
					forcedStyleLayoutMsInLongFrames += script.forcedStyleAndLayoutDuration ?? 0;
			}
		});
		if (longFrameSupported) observer.observe({ type: 'long-animation-frame' });
		let previous = 0;
		let raf: number;
		const sample = (time: number) => {
			peakActive = Math.max(peakActive, view.component.stats().active);
			if (previous) frames.push(time - previous);
			previous = time;
			raf = requestAnimationFrame(sample);
		};
		raf = requestAnimationFrame(sample);
		const before = metricsToMap(
			session ? ((await session.send('Performance.getMetrics')) as Metrics) : { metrics: [] }
		);
		const started = performance.now();
		try {
			view.component.reorder();
			const transactionMs = performance.now() - started;
			await pause(950);
			const after = metricsToMap(
				session ? ((await session.send('Performance.getMetrics')) as Metrics) : { metrics: [] }
			);
			const row: Record<string, number | string> = {
				count,
				backend,
				transactionMs,
				boundsReads,
				styleReads,
				maxFrameMs: Math.max(...frames),
				framesOver25ms: frames.filter((value) => value > 25).length,
				estimatedMissed60HzFrames: frames.reduce(
					(sum, value) => sum + Math.max(0, Math.round(value / (1000 / 60)) - 1),
					0
				),
				activeAtSettle: view.component.stats().active
			};
			for (const key of [
				'LayoutCount',
				'RecalcStyleCount',
				'LayoutDuration',
				'RecalcStyleDuration',
				'ScriptDuration',
				'TaskDuration'
			])
				row[key] = (after.get(key) ?? 0) - (before.get(key) ?? 0);
			row.peakActive = peakActive;
			row.longFrames = longFrames;
			row.forcedStyleLayoutMsInLongFrames = longFrameSupported
				? forcedStyleLayoutMsInLongFrames
				: -1;
			row.heapBytesAtEnd = after.get('JSHeapUsedSize') ?? 0;
			rows.push(row);
			expect(row.activeAtSettle).toBe(0);
		} finally {
			cancelAnimationFrame(raf);
			observer.disconnect();
			Element.prototype.getBoundingClientRect = bounds;
			window.getComputedStyle = computed;
			await view.unmount();
		}
	}
	await commands.writeFile(
		`docs/research/performance-${server.browser}${import.meta.env.VITE_PERFORMANCE_SUFFIX ?? ''}.json`,
		JSON.stringify(
			{
				browser: navigator.userAgent,
				date: new Date().toISOString(),
				workload:
					'one reverse; 600px 10-column grid; one sample per count; 500-node instant baseline; dev-mode Vitest; not production benchmark',
				rows
			},
			null,
			2
		)
	);
}, 15000);
