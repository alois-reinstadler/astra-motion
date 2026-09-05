import { flushSync, tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LifecycleSpike, { type Measurement } from './LifecycleSpike.svelte';

describe('Svelte 5.57 layout measurement spike', () => {
	it('compares top-level and attachment pre-effects against actual DOM geometry', async () => {
		const measurements: Measurement[] = [];
		const { component } = await render(LifecycleSpike, {
			record: (measurement) => measurements.push(measurement)
		});
		measurements.length = 0;
		component.change(200);
		await tick();
		console.info('layout lifecycle measurements', JSON.stringify(measurements));
		expect(measurements.find((value) => value.phase === 'component-pre')?.width).toBe(100);
		// The child block already committed, but the element's width has not: a mixed snapshot.
		expect(measurements.find((value) => value.phase === 'attachment-pre')).toMatchObject({
			width: 100,
			order: 'ba'
		});
		expect(measurements.find((value) => value.phase === 'attachment-post')?.order).toBe('ba');
		expect(measurements.find((value) => value.phase === 'cached')).toMatchObject({
			previousWidth: 100,
			width: 200
		});
	});

	it('retains the last committed geometry across repeated flushes without a pre-hook', async () => {
		const measurements: Measurement[] = [];
		const { component } = await render(LifecycleSpike, {
			record: (measurement) => measurements.push(measurement)
		});
		measurements.length = 0;
		for (const width of [200, 120, 320, 100]) {
			flushSync(() => component.change(width));
		}
		expect(
			measurements
				.filter((value) => value.phase === 'cached')
				.map(({ previousWidth, width }) => [previousWidth, width])
		).toEqual([
			[100, 200],
			[200, 120],
			[120, 320],
			[320, 100]
		]);
	});
});
