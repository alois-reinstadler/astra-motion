// Adapted from Motion v13.4.4 (33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343).
// Source groups: tests/motion-baseline/README.md; MIT: tests/motion-baseline/LICENSE.motion.
import { flushSync, tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamPresenceExpanded.svelte';

const node = (id: string, root: ParentNode = document) =>
	root.querySelector<HTMLElement>(`[data-expanded-item="${id}"]`);
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const opacity = (element: Element) => Number(getComputedStyle(element).opacity);
const x = (element: Element) => new DOMMatrix(getComputedStyle(element).transform).m41;
const keys = () =>
	[...document.querySelectorAll<HTMLElement>('[data-expanded-item]')].map(
		(e) => e.dataset.expandedItem
	);

it('presence-default-enter: default presence permits an intermediate initial pose', async () => {
	const view = render(Fixture, { scenario: 'default' });
	await expect.poll(() => x(node('a')!), { interval: 5 }).toBeGreaterThan(0);
	expect(x(node('a')!)).toBeLessThan(100);
	await expect.poll(() => x(node('a')!)).toBe(100);
	expect(view.component.read().some((e) => e.event === 'x' && e.value! > 0 && e.value! < 100)).toBe(
		true
	);
});

for (const scenario of ['empty', 'plain', 'noexit'])
	it(`presence-empty-exits: ${scenario} releases its managed record`, async () => {
		const done = vi.fn();
		const view = render(Fixture, { scenario, onComplete: done, initialMode: 'wait' });
		await tick();
		expect(node(scenario === 'empty' ? 'empty' : 'a')).not.toBeNull();
		flushSync(() => view.component.select([]));
		await expect.poll(() => document.querySelector('[data-expanded-item]')).toBeNull();
		expect(done).toHaveBeenCalledTimes(1);
		if (scenario === 'noexit') {
			flushSync(() => view.component.select(['b']));
			await expect.poll(() => node('b')).not.toBeNull();
		}
	});

it('presence-noop-descendant-exit: satisfied long descendant exits do not block removal', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'noop', onComplete: done });
	await expect
		.poll(() =>
			[...document.querySelectorAll('[data-expanded-noop]')].every((e) => opacity(e) === 1)
		)
		.toBe(true);
	expect(document.querySelectorAll('[data-expanded-noop]')).toHaveLength(2);
	flushSync(() => view.component.select([]));
	await expect.poll(() => node('a'), { timeout: 1000 }).toBeNull();
	expect(done).toHaveBeenCalledTimes(1);
});

for (const action of ['close', 'switch', 'interrupt-close', 'interrupt-switch'])
	it(`presence-height-interruption: ${action} retains visible height until exit ends`, async () => {
		const view = render(Fixture, { scenario: 'height' });
		await expect.poll(() => node('a')?.getBoundingClientRect().height).toBeCloseTo(100, 0);
		if (action.startsWith('interrupt')) {
			flushSync(() => view.component.select(['b']));
			await expect
				.poll(() => node('b')?.getBoundingClientRect().height ?? 0, { interval: 5 })
				.toBeGreaterThan(5);
			expect(node('b')!.getBoundingClientRect().height).toBeLessThan(100);
			flushSync(() => view.component.select(action === 'interrupt-close' ? [] : ['c']));
			await frame();
			expect(node('b')!.getBoundingClientRect().height).toBeGreaterThan(0);
			if (action === 'interrupt-switch')
				await expect.poll(() => node('c')?.getBoundingClientRect().height ?? 0).toBeGreaterThan(0);
			await expect.poll(() => node('b')).toBeNull();
		} else {
			flushSync(() => view.component.select(action === 'close' ? [] : ['b']));
			await expect
				.poll(() => node('a')?.getBoundingClientRect().height ?? 100, { interval: 5 })
				.toBeLessThan(95);
			expect(node('a')!.getBoundingClientRect().height).toBeGreaterThan(0);
			if (action === 'switch')
				await expect.poll(() => node('b')?.getBoundingClientRect().height ?? 0).toBeGreaterThan(0);
		}
		await expect.poll(() => node('a')).toBeNull();
		await expect
			.poll(() => keys())
			.toEqual(action === 'switch' ? ['b'] : action === 'interrupt-switch' ? ['c'] : []);
	});

it('presence-exit-variant-orchestration: inherited child finishes before afterChildren parent begins', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'orchestrate', onComplete: done });
	await expect.poll(() => opacity(node('a')!)).toBe(1);
	view.component.clear();
	flushSync(() => view.component.select([]));
	const child = document.querySelector<HTMLElement>('[data-expanded-inner]')!;
	await expect.poll(() => x(child), { interval: 5 }).toBeGreaterThan(0);
	expect(x(node('a')!)).toBe(0);
	await expect.poll(() => node('a')).toBeNull();
	const events = view.component.read().map((e) => e.event);
	expect(events.indexOf('child-orchestrated')).toBeGreaterThanOrEqual(0);
	expect(events.indexOf('orchestrated')).toBeGreaterThan(events.indexOf('child-orchestrated'));
	expect(done).toHaveBeenCalledTimes(1);
});

it('presence-custom-precedence: boundary custom reaches parent and wrapped descendant exits', async () => {
	const view = render(Fixture, { scenario: 'custom' });
	await expect.poll(() => opacity(node('a')!)).toBe(1);
	view.component.clear();
	flushSync(() => {
		view.component.configure(-2);
		view.component.select([]);
	});
	await expect.poll(() => node('a')).toBeNull();
	for (const event of ['parent-x', 'child-x']) {
		const samples = view.component
			.read()
			.filter((e) => e.event === event)
			.map((e) => e.value);
		expect(samples).toContain(-200);
		expect(samples.some((v) => v! < 0)).toBe(true);
	}
});

it('presence-dynamic-custom-switches: rapid dynamic variants remove every obsolete key', async () => {
	const done = vi.fn();
	const view = render(Fixture, { onComplete: done });
	await expect.poll(() => opacity(node('a')!)).toBe(1);
	for (const [i, id] of ['b', 'c', 'd'].entries())
		flushSync(() => {
			view.component.configure(i % 2 ? -1 : 1);
			view.component.select([id]);
		});
	expect(node('a')).not.toBeNull();
	await expect.poll(() => keys()).toEqual(['d']);
	await expect.poll(() => opacity(node('d')!)).toBe(1);
	expect(done).toHaveBeenCalledTimes(1);
	await frame();
	await frame();
	expect(done).toHaveBeenCalledTimes(1);
});

it('presence-rapid-sync-sequence: sync retains multiple exits and removes successive list keys', async () => {
	const view = render(Fixture);
	await tick();
	flushSync(() => view.component.select(['b']));
	flushSync(() => view.component.select(['c']));
	expect(keys()).toEqual(expect.arrayContaining(['a', 'b', 'c']));
	await expect.poll(() => keys()).toEqual(['c']);
	flushSync(() => view.component.select(['a', 'b', 'c']));
	await expect.poll(() => opacity(node('a')!)).toBe(1);
	for (const expected of [['b', 'c'], ['c'], []]) {
		flushSync(() => view.component.select(expected));
		await expect.poll(() => keys()).toEqual(expected);
	}
});

it('presence-keyed-order: surviving keys retain DOM, order, and animated pose', async () => {
	const view = render(Fixture, { initialItems: ['a', 'persist', 'b'] });
	await expect.poll(() => opacity(node('persist')!)).toBe(1);
	const persistent = node('persist');
	view.component.clear();
	flushSync(() => view.component.select(['c', 'd', 'persist']));
	expect(node('persist')).toBe(persistent);
	expect(keys().filter((id) => ['c', 'd', 'persist'].includes(id!))).toEqual(['c', 'd', 'persist']);
	for (let i = 0; i < 4; i++) {
		await frame();
		expect(opacity(persistent!)).toBe(1);
	}
	await expect.poll(() => keys()).toEqual(['c', 'd', 'persist']);
	expect(
		view.component
			.read()
			.filter((e) => e.id === 'persist' && e.event === 'opacity')
			.every((e) => e.value === 1)
	).toBe(true);
});
it('presence-keyed-order: reordered owners keep independent wait content', async () => {
	const view = render(Fixture, { scenario: 'owner-reorder', initialItems: ['a', 'b'] });
	await tick();
	expect(document.querySelector('[data-expanded-content="a"]')).not.toBeNull();
	flushSync(() => view.component.select(['b', 'a']));
	await expect
		.poll(() => document.querySelector('[data-expanded-content="b"]')?.textContent)
		.toBe('b');
	await expect.poll(() => document.querySelector('[data-expanded-content="a"]')).toBeNull();
	expect(document.querySelector('[data-expanded-spacer="a"]')).not.toBeNull();
});

it('presence-mode-switch: wait and popLayout mode changes preserve child identity', async () => {
	const done = vi.fn();
	const view = render(Fixture, { initialMode: 'wait', onComplete: done });
	await expect.poll(() => opacity(node('a')!)).toBe(1);
	const original = node('a');
	for (const mode of ['popLayout', 'wait'] as const) {
		flushSync(() => view.component.changeMode(mode));
		await frame();
		expect(node('a')).toBe(original);
		expect(opacity(original!)).toBe(1);
	}
	flushSync(() => view.component.select([]));
	await expect.poll(() => node('a')).toBeNull();
	expect(done).toHaveBeenCalledTimes(1);
});
it('presence-controls-initial-false: mounted controls reach their target inside suppressed initial presence', async () => {
	const view = render(Fixture, { scenario: 'controls', initial: false });
	await expect.poll(() => x(node('a')!)).toBe(80);
	flushSync(() => view.component.select([]));
	await expect.poll(() => node('a')).toBeNull();
});

for (const objectInitial of [true, false])
	it(`presence-completed-reentry-initial: ${objectInitial ? 'object pose' : 'custom resolver'} resets after completed exit`, async () => {
		const view = render(Fixture, {
			scenario: objectInitial ? 'reentry' : 'reentry-custom',
			initialItems: ['fast', 'slow'],
			initial: !objectInitial
		});
		await expect.poll(() => opacity(node('fast')!)).toBe(1);
		if (!objectInitial) {
			flushSync(() => view.component.select([]));
			await expect.poll(() => opacity(node('fast')!)).toBe(0);
			view.component.clear();
			flushSync(() => {
				view.component.configure(-3);
				view.component.select(['fast']);
			});
			await expect.poll(() => opacity(node('fast')!)).toBe(1);
			expect(
				view.component
					.read()
					.filter((e) => e.event === 'enter-custom' && e.id === 'fast')
					.map((e) => e.value)
			).toContain(-3);
		} else {
			flushSync(() => view.component.select([]));
			await expect.poll(() => opacity(node('fast')!)).toBe(0);
			expect(node('slow')).not.toBeNull();
			view.component.clear();
			flushSync(() => view.component.select(['fast', 'slow']));
			await expect
				.poll(
					() =>
						view.component
							.read()
							.find((entry) => entry.event === 'value-opacity' && entry.id === 'fast')?.value
				)
				.toBe(0.5);
			await expect.poll(() => opacity(node('fast')!)).toBe(1);
		}
	});

it('presence-descendant-unregister: removing the final registered motion child releases its retained owner', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'unregister', onComplete: done });
	await tick();
	flushSync(() => view.component.select([]));
	expect(node('a')).not.toBeNull();
	flushSync(() => view.component.dropInner());
	await expect.poll(() => node('a'), { timeout: 1000 }).toBeNull();
	expect(done).toHaveBeenCalledTimes(1);
});
it('presence-context-default: public presence data is undefined outside a boundary', async () => {
	const view = render(Fixture, { scenario: 'outside' });
	await tick();
	expect(document.querySelector('[data-expanded-outside]')?.textContent).toBe('undefined');
	flushSync(() => view.component.configure(99));
	expect(document.querySelector('[data-expanded-outside]')?.textContent).toBe('undefined');
});
it('presence-manual-multi-exit: release is independent, idempotent, and reusable after remount', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'manual', onComplete: done });
	await tick();
	for (let cycle = 1; cycle <= 2; cycle++) {
		flushSync(() => view.component.select([]));
		await tick();
		view.component.release('a');
		await tick();
		expect(node('a')).not.toBeNull();
		expect(done).toHaveBeenCalledTimes(cycle - 1);
		flushSync(() => view.component.select([]));
		flushSync(() => view.component.select([]));
		view.component.release('a');
		view.component.release('a-second');
		view.component.release('a-second');
		await expect.poll(() => node('a')).toBeNull();
		expect(done).toHaveBeenCalledTimes(cycle);
		if (cycle === 1) {
			flushSync(() => view.component.select(['a']));
			await tick();
			expect(node('a')).not.toBeNull();
		}
	}
});

it('presence-layout-completion: sibling boundaries in one group release each exit once', async () => {
	const done = vi.fn();
	const view = render(Fixture, {
		scenario: 'siblings',
		initialItems: ['a', 'b'],
		onComplete: done
	});
	await tick();
	flushSync(() => view.component.select([]));
	expect(keys()).toEqual(['a', 'b']);
	await expect.poll(() => keys()).toEqual([]);
	expect(done).toHaveBeenCalledTimes(2);
});
it('presence-layout-completion: repeated shared layout replacement leaves only the latest record', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'layout', onComplete: done });
	await expect.poll(() => opacity(node('a')!)).toBe(1);
	for (const [index, id] of ['b', 'a', 'b'].entries()) {
		flushSync(() => view.component.select([id]));
		await expect.poll(() => keys()).toEqual([id]);
		expect(done).toHaveBeenCalledTimes(index + 1);
	}
	flushSync(() => view.component.select([]));
	await expect.poll(() => keys()).toEqual([]);
	expect(done).toHaveBeenCalledTimes(4);
});

for (const variant of [
	'rtl',
	'relative',
	'fractional',
	'content-box',
	'right-bottom',
	'shadow',
	'shadow-relative'
])
	it(`pop-geometry-matrix: ${variant} retains its rectangle and restores authored styles`, async () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = variant.startsWith('shadow') ? host.attachShadow({ mode: 'open' }) : undefined;
		const target = shadow ? document.createElement('div') : host;
		if (shadow) shadow.append(target);
		const css = `width:${variant === 'fractional' ? '201.375' : '200'}px;height:40px;${variant === 'content-box' ? 'box-sizing:content-box;padding:20px;border:5px solid;' : ''}${variant.includes('relative') ? 'position:relative;left:23px;top:17px;' : ''}`;
		const view = render(Fixture, {
			target,
			props: {
				scenario: 'pop',
				initialItems: ['a', 'b'],
				initialMode: 'popLayout',
				direction: variant === 'rtl' ? 'rtl' : 'ltr',
				anchorX: variant === 'right-bottom' ? 'right' : 'left',
				anchorY: variant === 'right-bottom' ? 'bottom' : 'top',
				css,
				root: shadow
			}
		});
		try {
			await tick();
			const a = target.querySelector<HTMLElement>('[data-expanded-manual="a"]')!;
			const b = target.querySelector<HTMLElement>('[data-expanded-manual="b"]')!;
			const before = a.getBoundingClientRect();
			const below = b.getBoundingClientRect().top;
			const authored = a.getAttribute('style');
			flushSync(() => view.component.select(['b']));
			await expect.poll(() => getComputedStyle(a).position).toBe('absolute');
			for (const field of ['left', 'top', 'width', 'height'] as const)
				expect(Math.abs(a.getBoundingClientRect()[field] - before[field])).toBeLessThan(0.6);
			expect(b.getBoundingClientRect().top).toBeLessThan(below);
			flushSync(() => view.component.select(['a', 'b']));
			await tick();
			expect(a.getAttribute('style')).toBe(authored);
			expect(a.hasAttribute('data-astra-presence-pop')).toBe(false);
		} finally {
			await view.unmount();
			host.remove();
		}
	});

it('presence-layout-completion: shared layout identity crosses independent presence boundaries once per exit', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'shared-boundaries', onComplete: done });
	await tick();
	for (const [index, id] of ['b', 'a', 'b'].entries()) {
		flushSync(() => view.component.select([id]));
		await expect.poll(() => keys()).toEqual([id]);
		expect(done).toHaveBeenCalledTimes(index + 1);
	}
});
it('presence-layout-completion: inner then outer layout removal releases every retained node', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'nested-layout', onComplete: done });
	await tick();
	expect(node('inner')).not.toBeNull();
	flushSync(() => view.component.dropInner());
	await frame();
	expect(node('inner')).not.toBeNull();
	flushSync(() => view.component.select([]));
	await expect.poll(() => keys()).toEqual([]);
	expect(done).toHaveBeenCalledTimes(1);
});

it('presence-empty-exits: a motion child without exit cannot delay the next wait child', async () => {
	const done = vi.fn();
	const view = render(Fixture, { scenario: 'noexit', initialMode: 'wait', onComplete: done });
	await tick();
	flushSync(() => view.component.select(['b']));
	await expect.poll(() => keys(), { timeout: 1000 }).toEqual(['b']);
	expect(done).toHaveBeenCalledTimes(1);
});
it('presence-custom-precedence: latest boundary data stays live while active exits preserve their captured target', async () => {
	const view = render(Fixture, { scenario: 'custom' });
	await expect.poll(() => opacity(node('a')!)).toBe(1);
	view.component.clear();
	flushSync(() => {
		view.component.configure(-1);
		view.component.select([]);
	});
	await expect.poll(() => x(node('a')!), { interval: 5 }).toBeLessThan(0);
	flushSync(() => view.component.configure(-2));
	await expect
		.poll(
			() =>
				view.component
					.read()
					.filter((entry) => entry.event === 'presence-data')
					.at(-1)?.value
		)
		.toBe(-2);
	await expect.poll(() => node('a')).toBeNull();
	for (const event of ['parent-x', 'child-x'])
		expect(
			view.component
				.read()
				.filter((e) => e.event === event)
				.map((e) => e.value)
		).toContain(-100);
});
