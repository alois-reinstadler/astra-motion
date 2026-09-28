import { startViewTransition } from '../motion/view-transitions.js';
import { flushSync, tick } from 'svelte';
import { expect, it } from 'vitest';
import { JSAnimation, motionValue, arc } from 'motion-dom';
import Spring from './ReleaseAuditSpring.svelte';
import BorrowedPolicy from './ReleaseAuditBorrowedPolicy.svelte';
import { render } from 'vitest-browser-svelte';
import Harness from './parity-values-harness.svelte';
import {
	applyViewNames,
	registerViewParticipant,
	type ViewSnapshot
} from '../motion/view-registry.js';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async () => {
	await frame();
	await frame();
	await frame();
};

it('keeps a replacement View capture name when an old restore callback runs again', () => {
	const node = document.createElement('div');
	node.style.setProperty('view-transition-name', 'authored', 'important');
	const snapshots = new Map([
		[
			'name',
			{
				name: 'astra_view_test',
				participant: {
					node,
					id: 'audit',
					owner: Symbol(),
					options: () => ({}),
					isActive: () => true
				},
				options: {},
				fingerprint: '',
				box: [0, 0, 10, 10]
			} satisfies ViewSnapshot
		]
	]);
	const oldRestore = applyViewNames(snapshots);
	oldRestore();
	const newRestore = applyViewNames(snapshots);
	oldRestore();
	expect(node.style.viewTransitionName).toBe('astra_view_test');
	newRestore();
	expect(node.style.viewTransitionName).toBe('authored');
	expect(node.style.getPropertyPriority('view-transition-name')).toBe('important');
});

it('preserves a scalar spring target across Activity hide and reveal', async () => {
	const screen = render(Harness);
	try {
		await tick();
		const { directSpring } = screen.component.getApi();
		directSpring.set(100);
		await expect.poll(() => directSpring.get()).toBeGreaterThan(0);
		flushSync(() => screen.component.configure({ visible: false }));
		const held = directSpring.get();
		await frames();
		expect(directSpring.get()).toBe(held);
		flushSync(() => screen.component.configure({ visible: true }));
		await directSpring.animation;
		expect(directSpring.get()).toBe(100);
	} finally {
		await screen.unmount();
	}
});

it('respects an explicit useAnimate reduceMotion false during live policy updates', async () => {
	const screen = render(Harness);
	try {
		await tick();
		const api = screen.component.getApi();
		const controls = api.animate(
			'.subject',
			{ x: [0, 100] },
			{ duration: 10, ease: 'linear', reduceMotion: false }
		);
		controls.pause();
		controls.time = 2;
		await frames();
		const node = api.scope.current!.querySelector('.subject')!;
		expect(new DOMMatrix(getComputedStyle(node).transform).m41).toBe(20);
		flushSync(() => screen.component.configure({ reduce: 'always' }));
		await frames();
		expect(new DOMMatrix(getComputedStyle(node).transform).m41).toBe(20);
		expect(controls.state).toBe('paused');
	} finally {
		await screen.unmount();
	}
});

it('does not complete borrowed playback when a consumer changes reduced-motion policy', async () => {
	const x = motionValue(0);
	const screen = render(BorrowedPolicy, { x });
	const external = new JSAnimation({
		keyframes: [0, 100],
		duration: 10000,
		ease: 'linear',
		onUpdate: (value) => x.set(value)
	});
	void x.start(() => external);
	try {
		await expect.poll(() => x.get()).toBeGreaterThan(0);
		const before = x.get();
		flushSync(() => screen.component.reduce());
		await frames();
		expect(external.state).toBe('running');
		expect(x.get()).toBeGreaterThan(before);
		expect(x.get()).toBeLessThan(100);
		expect(
			new DOMMatrix(getComputedStyle(document.querySelector('[data-audit-owned]')!).transform).m42
		).toBe(100);
	} finally {
		await screen.unmount();
		external.stop();
		x.destroy();
	}
});

it('retains hidden scalar spring sets, option changes, jump and stop semantics without hidden clocks', async () => {
	const screen = render(Spring);
	try {
		await tick();
		const { number, units, reactive } = screen.component.getApi();
		number.set(100);
		units.set('100px');
		flushSync(() => screen.component.configure({ settings: { duration: 0.1, bounce: 0 } }));
		await Promise.all([number.animation, units.animation]);
		expect(number.get()).toBe(100);
		expect(units.get()).toBe('100px');
		flushSync(() => screen.component.configure({ visible: false }));
		number.set(200);
		units.set('200px');
		await frames();
		expect(number.animation).toBeUndefined();
		expect(units.animation).toBeUndefined();
		expect(number.get()).toBe(100);
		expect(units.get()).toBe('100px');
		flushSync(() => screen.component.configure({ visible: true, scalar: 50 }));
		await Promise.all([number.animation, units.animation, reactive.animation]);
		expect(number.get()).toBe(200);
		expect(units.get()).toBe('200px');
		expect(reactive.get()).toBe(50);
		number.jump(75);
		units.set('300px');
		units.stop();
		const stopped = units.get();
		flushSync(() => screen.component.configure({ visible: false }));
		flushSync(() => screen.component.configure({ visible: true }));
		await frames();
		expect(number.get()).toBe(75);
		expect(units.get()).toBe(stopped);
		expect(number.animation).toBeUndefined();
		expect(units.animation).toBeUndefined();
	} finally {
		await screen.unmount();
	}
});

it.each(['sequence', 'arc', 'arc-sequence'] as const)(
	'preserves explicit reduced-motion opt-outs on %s playback',
	async (kind) => {
		const screen = render(Harness);
		try {
			await tick();
			const { animate, scope } = screen.component.getApi();
			const options = {
				duration: 10,
				ease: 'linear' as const,
				reduceMotion: false,
				...(kind.includes('arc') ? { path: arc({ strength: 1 }) } : {})
			};
			const controls =
				kind === 'arc'
					? animate('.subject', { x: [0, 100], y: [0, 0] }, options)
					: animate([['.subject', { x: [0, 100], y: [0, 0] }, options]], { reduceMotion: false });
			controls.pause();
			controls.time = 2;
			await frames();
			const node = scope.current!.querySelector('.subject')!;
			const held = node.getAttribute('style');
			flushSync(() => screen.component.configure({ reduce: 'always' }));
			await frames();
			expect(node.getAttribute('style')).toBe(held);
			expect(controls.state).toBe('paused');
		} finally {
			await screen.unmount();
		}
	}
);

it('keeps a replacement capture intact when the browser invokes a skipped update late', async () => {
	const node = document.createElement('div');
	node.style.cssText = 'width:10px;height:10px;view-transition-name:authored';
	document.body.append(node);
	const unregister = registerViewParticipant({
		id: 'audit',
		owner: Symbol(),
		node,
		options: () => ({}),
		isActive: () => true
	});
	const original = Object.getOwnPropertyDescriptor(document, 'startViewTransition');
	const callbacks: (() => Promise<void>)[] = [];
	const never = new Promise<void>(() => {});
	Object.defineProperty(document, 'startViewTransition', {
		configurable: true,
		value: (update: () => Promise<void>) => {
			callbacks.push(update);
			return {
				ready: never,
				updateCallbackDone: never,
				finished: never,
				skipTransition() {},
				types: new Set()
			};
		}
	});
	let old: ReturnType<typeof startViewTransition> | undefined;
	let replacement: ReturnType<typeof startViewTransition> | undefined;
	let changes = 0;
	try {
		old = startViewTransition(() => {
			changes++;
		});
		await Promise.resolve();
		expect(callbacks).toHaveLength(1);
		replacement = startViewTransition(
			() => {
				changes++;
			},
			{ policy: 'replace' }
		);
		await Promise.resolve();
		expect(callbacks).toHaveLength(2);
		const captured = node.style.viewTransitionName;
		expect(captured).toMatch(/^astra_view_/);
		await callbacks[0]();
		expect(changes).toBe(1);
		expect(node.style.viewTransitionName).toBe(captured);
		await callbacks[1]();
		expect(changes).toBe(2);
		replacement.cancel();
		await Promise.all([old.finished, replacement.finished]);
		expect(node.style.viewTransitionName).toBe('authored');
		expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
	} finally {
		old?.cancel();
		replacement?.cancel();
		if (original) Object.defineProperty(document, 'startViewTransition', original);
		else Reflect.deleteProperty(document, 'startViewTransition');
		unregister();
		node.remove();
	}
});
