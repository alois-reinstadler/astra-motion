// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamMeasuredTargets.svelte';
const node = () => document.querySelector<HTMLElement>('[data-upstream-measured]')!;
const x = () => new DOMMatrix(getComputedStyle(node()).transform).m41;
it.each([false, true])(
	'measured-unit-targets: calc roundtrip preserves its expression with external=%s',
	async (external) => {
		const { component } = render(Fixture, {
			external,
			options: {
				initial: { x: 0 },
				style: { '--distance': '100px' },
				transition: { duration: 0.08, ease: 'linear' }
			}
		});
		expect(x()).toBe(0);
		flushSync(() => component.set({ animate: { x: 'calc(3 * var(--distance))' } }));
		await expect.poll(x).toBeCloseTo(300, 1);
		expect(node().style.transform).toContain('calc(3 * var(--distance))');
		flushSync(() => component.set({ animate: { x: 0 } }));
		await expect.poll(x).toBeCloseTo(0, 2);
	}
);
it.each([false, true])(
	'measured-unit-targets: height auto measures content and border-box padding (%s)',
	async (borderBox) => {
		const { component } = render(Fixture, {
			content: true,
			options: {
				initial: { height: 0 },
				style: {
					overflow: 'hidden',
					boxSizing: borderBox ? 'border-box' : 'content-box',
					paddingTop: borderBox ? 20 : 0,
					paddingBottom: borderBox ? 20 : 0
				},
				transition: { duration: 0.1, ease: 'linear' }
			}
		});
		flushSync(() => component.set({ animate: { height: 'auto' } }));
		await expect.poll(() => node().style.height).toBe('auto');
		expect(node().getBoundingClientRect().height).toBeCloseTo(borderBox ? 140 : 100, 1);
	}
);
it('measured-unit-targets: px-to-percent transforms and viewport-sized dimensions reach independent geometry', async () => {
	const { component } = render(Fixture, {
		options: {
			initial: { x: 0, width: 100, height: 100 },
			transition: { duration: 0.08, ease: 'linear' }
		}
	});
	flushSync(() => component.set({ animate: { x: '50%' } }));
	await expect.poll(x).toBeCloseTo(50, 1);
	flushSync(() => component.set({ animate: { x: 0, width: '25vh', height: '25vh' } }));
	await expect.poll(() => node().style.width).toBe('25vh');
	expect(node().getBoundingClientRect().width).toBeCloseTo(innerHeight / 4, 1);
	expect(node().getBoundingClientRect().height).toBeCloseTo(innerHeight / 4, 1);
	flushSync(() => component.set({ animate: { width: 100, height: 100 } }));
	await expect.poll(() => node().getBoundingClientRect().width).toBeCloseTo(100, 1);
});
it('measured-unit-targets: measuring auto preserves rotation and a bordered used width', async () => {
	const { component } = render(Fixture, {
		content: true,
		options: {
			initial: { width: '100px', height: 0, rotate: 45 },
			style: { border: '10px solid black', boxSizing: 'content-box' },
			transition: { duration: 10, ease: () => 0.5 }
		}
	});
	flushSync(() => component.set({ animate: { width: '200px', height: 'auto' } }));
	await expect.poll(() => parseFloat(getComputedStyle(node()).width)).toBeCloseTo(150, 1);
	const matrix = new DOMMatrix(getComputedStyle(node()).transform);
	expect((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI).toBeCloseTo(45, 2);
	expect(parseFloat(getComputedStyle(node()).height)).toBeCloseTo(50, 1);
});
it('measured-unit-targets: none origin is coerced before measuring a percentage positional target', async () => {
	const { component } = render(Fixture, {
		options: {
			initial: { top: 'none' },
			style: { position: 'absolute' },
			transition: { duration: 0.08 }
		}
	});
	flushSync(() => component.set({ animate: { top: '50%' } }));
	await expect
		.poll(
			() => node().getBoundingClientRect().top - node().parentElement!.getBoundingClientRect().top
		)
		.toBeCloseTo(100, 1);
});

it('measured-unit-targets: border-box auto measurement includes padding at the animation midpoint', async () => {
	const { component } = render(Fixture, {
		content: true,
		options: {
			initial: { height: 0 },
			style: { boxSizing: 'border-box', paddingTop: 20, paddingBottom: 20, overflow: 'hidden' },
			transition: { duration: 10, ease: () => 0.5 }
		}
	});
	// CSS clamps the rendered border-box origin to its 40px padding.
	expect(node().getBoundingClientRect().height).toBe(40);
	flushSync(() => component.set({ animate: { height: 'auto' } }));
	await expect.poll(() => parseFloat(getComputedStyle(node()).height)).toBeCloseTo(90, 1);
	expect(node().getBoundingClientRect().height).toBeCloseTo(90, 1);
});
