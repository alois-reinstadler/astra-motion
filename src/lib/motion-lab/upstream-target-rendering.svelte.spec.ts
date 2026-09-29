// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamTargetRendering.svelte';
const node = () => document.querySelector<HTMLElement | SVGElement>('[data-upstream-render]')!;
const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) await new Promise<void>((r) => requestAnimationFrame(() => r()));
};
it.each([
	{ property: 'display', from: 'none', to: 'block', first: 'block' },
	{ property: 'display', from: 'block', to: 'none', first: 'block' },
	{ property: 'visibility', from: 'hidden', to: 'visible', first: 'visible' },
	{ property: 'visibility', from: 'visible', to: 'hidden', first: 'visible' }
])(
	'target-discrete: $property $from to $to switches at its correct phase',
	async ({ property, from, to, first }) => {
		const complete = vi.fn();
		const updates: Record<string, unknown>[] = [];
		render(Fixture, {
			options: {
				initial: { [property]: from, opacity: from === 'none' || from === 'hidden' ? 0 : 1 },
				animate: { [property]: to, opacity: to === 'none' || to === 'hidden' ? 0 : 1 },
				transition: { duration: 0.15 },
				onUpdate: (v) => updates.push({ ...v }),
				onAnimationComplete: complete
			}
		});
		await expect.poll(() => complete.mock.calls.length).toBe(1);
		await frames();
		expect(updates.length).toBeGreaterThan(1);
		expect(updates[0][property]).toBe(first);
		if (to === 'none' || to === 'hidden') {
			const intermediate = updates.filter(
				(value) => Number(value.opacity) > 0 && Number(value.opacity) < 1
			);
			expect(intermediate.length).toBeGreaterThan(0);
			expect(intermediate.every((value) => value[property] === first)).toBe(true);
		}
		expect(getComputedStyle(node()).getPropertyValue(property)).toBe(to);
	}
);
it('target-discrete: display-only completion and numeric zIndex/fontWeight apply valid styles', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, {
		options: {
			initial: { display: 'none' },
			animate: { display: 'block' },
			transition: { duration: 0.01 },
			onAnimationComplete: complete,
			style: { fontWeight: 'normal' }
		}
	});
	await expect.poll(() => complete.mock.calls.length).toBe(1);
	expect(getComputedStyle(node()).display).toBe('block');
	flushSync(() => component.set({ animate: { zIndex: 100, fontWeight: 100 } }));
	await expect.poll(() => node().style.zIndex).toBe('100');
	await expect.poll(() => getComputedStyle(node()).fontWeight).toBe('100');
});
it('css-variable-targets: color variables interpolate and preserve the target expression', async () => {
	const updates: string[] = [];
	const complete = vi.fn();
	render(Fixture, {
		options: {
			style: { '--from': '#000000', '--to': '#ffffff' },
			initial: { backgroundColor: 'var(--from)' },
			animate: { backgroundColor: 'var(--to)' },
			transition: { duration: 0.15, ease: 'linear' },
			onUpdate: (v) => updates.push(String(v.backgroundColor)),
			onAnimationComplete: complete
		}
	});
	await expect.poll(() => complete.mock.calls.length).toBe(1);
	await frames();
	expect(
		updates.some(
			(value) =>
				value.startsWith('rgba(') && !['rgba(0, 0, 0, 1)', 'rgba(255, 255, 255, 1)'].includes(value)
		)
	).toBe(true);
	expect(node().style.backgroundColor).toBe('var(--to)');
	expect(getComputedStyle(node()).backgroundColor).toBe('rgb(255, 255, 255)');
});
it('css-variable-targets: unseen variables, whitespace origins and numerical variable targets render', async () => {
	const { component } = render(Fixture, {
		options: {
			style: { '--color': ' #fff ', '--end': 0.6 },
			animate: { '--color': '#000', '--new': '20px', opacity: 'var(--end)' },
			transition: { duration: 0.08 }
		}
	});
	await expect.poll(() => node().style.getPropertyValue('--new')).toBe('20px');
	await expect.poll(() => node().style.getPropertyValue('--color')).toBe('#000');
	await expect.poll(() => Number(getComputedStyle(node()).opacity)).toBe(0.6);
	flushSync(() => component.set({ animate: { '--color': '#fff', '--new': '30px', x: 0 } }));
	await expect.poll(() => node().style.getPropertyValue('--new')).toBe('30px');
});
it.each(['single', 'sequence'] as const)(
	'css-variable-targets: SVG %s custom properties live in style and affect paint',
	async (mode) => {
		const { component } = render(Fixture, {
			svg: true,
			options: { style: { '--trim': 0, strokeDasharray: 'var(--trim) 1', stroke: 'black' } }
		});
		await tick();
		const { animate } = component.api();
		const run =
			mode === 'single'
				? animate(node(), { '--trim': [0, 1] }, { duration: 1, ease: 'linear', autoplay: false })
				: animate([[node(), { '--trim': [0, 1] }, { duration: 1, ease: 'linear' }]]);
		run.pause();
		run.time = 0.5;
		await frames();
		expect(parseFloat(node().style.getPropertyValue('--trim'))).toBeCloseTo(0.5, 2);
		expect(node().hasAttribute('--trim')).toBe(false);
		expect(parseFloat(getComputedStyle(node()).strokeDasharray)).toBeCloseTo(0.5, 2);
		run.complete();
		await run;
	}
);
it('paint-retarget: blur animates and returns to zero with two completions', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, {
		options: {
			initial: { filter: 'blur(0px)' },
			animate: { filter: 'blur(8px)' },
			transition: { duration: 0.08 },
			onAnimationComplete: complete
		}
	});
	await expect.poll(() => complete.mock.calls.length).toBe(1);
	expect(getComputedStyle(node()).filter).toBe('blur(8px)');
	flushSync(() => component.set({ animate: { filter: 'blur(0px)' } }));
	await expect.poll(() => complete.mock.calls.length).toBe(2);
	expect(getComputedStyle(node()).filter).toMatch(/^(none|blur\(0px\))$/);
});
it.each(['none', 'rgb(0, 0, 0) 5px 5px 50px 0px'])(
	'paint-retarget: box-shadow reads origin %s and reaches the target',
	async (origin) => {
		const updates: string[] = [];
		render(Fixture, {
			options: {
				style: { boxShadow: origin },
				animate: { boxShadow: '5px 5px 0px #fff' },
				transition: { duration: 0.1, ease: 'linear' },
				onUpdate: (v) => updates.push(String(v.boxShadow))
			}
		});
		await expect
			.poll(() => getComputedStyle(node()).boxShadow)
			.toBe('rgb(255, 255, 255) 5px 5px 0px 0px');
		expect(updates.length).toBeGreaterThan(1);
	}
);
it('paint-retarget: gradient first render interpolates and interrupted color ends on the replacement target', async () => {
	const updates: string[] = [];
	const from = 'linear-gradient(180deg, rgb(0, 0, 0) 0%, rgb(255, 255, 255) 100%)';
	const to = 'linear-gradient(0deg, rgb(0, 0, 0) 0%, rgb(255, 255, 255) 100%)';
	const gradient = render(Fixture, {
		options: {
			style: { background: from },
			animate: { background: to },
			transition: { duration: 0.2, ease: 'linear' },
			onUpdate: (value) => updates.push(String(value.background))
		}
	});
	const intermediateAngle = () =>
		updates.some((value) => {
			const match = /linear-gradient\((-?[\d.]+)deg/.exec(value);
			return match && Number(match[1]) > 0 && Number(match[1]) < 180;
		});
	await expect.poll(intermediateAngle).toBe(true);
	await gradient.unmount();
	const { component } = render(Fixture, {
		options: {
			initial: { backgroundColor: '#ff0000' },
			animate: { backgroundColor: '#0000ff' },
			transition: { duration: 0.2, ease: 'linear' }
		}
	});
	const rgb = () =>
		getComputedStyle(node())
			.backgroundColor.match(/[\d.]+/g)!
			.slice(0, 3)
			.map(Number);
	await expect
		.poll(
			() => {
				const [r, , b] = rgb();
				return r > 0 && r < 255 && b > 0 && b < 255;
			},
			{ interval: 5 }
		)
		.toBe(true);
	// Replacement duration outlasts the interrupted animation's entire remaining lifetime.
	flushSync(() =>
		component.set({
			animate: { backgroundColor: '#00ff00' },
			transition: { duration: 0.4, ease: 'linear' }
		})
	);
	await expect.poll(() => getComputedStyle(node()).backgroundColor).toBe('rgb(0, 255, 0)');
	await frames(3);
	expect(getComputedStyle(node()).backgroundColor).toBe('rgb(0, 255, 0)');
});
it.each(['opacity', 'x'] as const)(
	'svg-instant-reentry: a zero-duration %s target replaces a finished native effect',
	async (property) => {
		const from = property === 'opacity' ? 1 : 0;
		const to = property === 'opacity' ? 0 : 50;
		const { component } = render(Fixture, {
			svg: true,
			options: {
				initial: { [property]: from },
				animate: { [property]: to },
				transition: { duration: 0.08 }
			}
		});
		const value = () =>
			property === 'opacity'
				? Number(getComputedStyle(node()).opacity)
				: new DOMMatrix(getComputedStyle(node()).transform).m41;
		await expect.poll(value).toBe(to);
		flushSync(() => component.set({ animate: { [property]: from }, transition: { duration: 0 } }));
		await expect.poll(value).toBe(from);
		await frames(5);
		expect(value()).toBe(from);
	}
);
