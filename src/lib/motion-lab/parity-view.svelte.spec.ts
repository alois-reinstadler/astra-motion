import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './ParityView.svelte';
import Nested from './ParityViewNested.svelte';
import { startViewTransition } from '../motion/view-transitions.js';
import type { AnimationPlaybackControls } from 'motion-dom';

const card = () => document.querySelector<HTMLElement>('[data-native-view]');

it('animates update/share/exit/enter and restores authored names after every transaction', async () => {
	const start = vi.fn();
	const complete = vi.fn();
	const { component } = render(Fixture, { onStart: start, onComplete: complete });
	await tick();
	const native = Boolean(document.startViewTransition);
	const original = card();
	await component.change().finished;
	expect(card()).toBe(original);
	expect(card()?.querySelector('[data-view-count]')?.textContent).toBe('1');
	expect(card()?.style.getPropertyValue('view-transition-name')).toBe('authored-card');
	expect(card()?.style.getPropertyPriority('view-transition-name')).toBe('important');
	await component.share().finished;
	expect(card()).not.toBe(original);
	expect(card()?.dataset.nativeView).toBe('b');
	await component.toggle().finished;
	expect(card()).toBeNull();
	await component.toggle().finished;
	expect(card()).not.toBeNull();
	expect(complete.mock.calls.map(([type]) => type)).toEqual(
		native ? ['update', 'share', 'exit', 'enter'] : []
	);
	expect(start).toHaveBeenCalledTimes(native ? 4 : 0);
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
});

it('waits for asynchronous state and passes contextual types to the animation resolver', async () => {
	const types = vi.fn();
	const { component } = render(Fixture, { onTypes: types });
	await tick();
	const handle = component.asyncChange();
	await handle.updateCallbackDone;
	expect(card()?.querySelector('[data-view-count]')?.textContent).toBe('1');
	await handle.finished;
	expect(handle.types).toEqual(['next', 'loaded']);
	if (typeof document.startViewTransition === 'function')
		expect(types).toHaveBeenCalledWith(['next', 'loaded']);
	else expect(types).not.toHaveBeenCalled();
});

it('cancels active layers without dispatching successful completion and leaves mutations applied', async () => {
	const complete = vi.fn();
	const { component } = render(Fixture, { onComplete: complete });
	await tick();
	const handle = component.change();
	if (typeof document.startViewTransition === 'function') {
		await handle.ready;
		handle.cancel();
		await expect(handle.finished).resolves.toBe('skipped');
	} else await expect(handle.finished).resolves.toBe('unsupported');
	expect(card()?.querySelector('[data-view-count]')?.textContent).toBe('1');
	expect(complete).not.toHaveBeenCalled();
	expect(card()?.style.viewTransitionName).toBe('authored-card');
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
});

it('does not classify an inner-boundary content mutation as a parent update', async () => {
	const outer = vi.fn();
	const inner = vi.fn();
	const { component } = render(Nested, { onOuter: outer, onInner: inner });
	await tick();
	await component.update().finished;
	expect(outer).not.toHaveBeenCalled();
	if (typeof document.startViewTransition === 'function')
		expect(inner).toHaveBeenCalledExactlyOnceWith('update');
	else expect(inner).not.toHaveBeenCalled();
});

it('diagnoses duplicate view names while preserving application state', async () => {
	const diagnostic = vi.fn();
	const { component } = render(Fixture, { duplicate: true, onDiagnostic: diagnostic });
	await tick();
	await component.change().finished;
	expect(card()?.querySelector('[data-view-count]')?.textContent).toBe('1');
	if (typeof document.startViewTransition === 'function')
		expect(diagnostic).toHaveBeenCalledWith(expect.stringContaining('Duplicate AnimateView name'));
	else expect(diagnostic).not.toHaveBeenCalled();
});

it('exposes an asynchronous callback rejection without leaving owned reset styles', async () => {
	const { unmount } = render(Fixture);
	await tick();
	const error = new Error('content request failed');
	const handle = startViewTransition(
		async () => {
			await Promise.resolve();
			throw error;
		},
		{ reducedMotion: 'never' }
	);
	await expect(handle.updateCallbackDone).rejects.toBe(error);
	await expect(handle.finished).rejects.toBe(error);
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
	await unmount();
});

it('groups multiple roots into one callback and supports custom pseudo-element keyframes and controls', async () => {
	let controls: AnimationPlaybackControls | undefined;
	const start = vi.fn((animation: AnimationPlaybackControls) => {
		controls = animation;
		animation.pause();
	});
	const complete = vi.fn();
	const definition = vi.fn();
	const { component } = render(Fixture, {
		custom: true,
		multiple: true,
		onStart: start,
		onComplete: complete,
		onTypes: definition
	});
	await tick();
	const handle = component.change();
	await handle.ready;
	if (typeof document.startViewTransition === 'function') {
		expect(start).toHaveBeenCalledTimes(1);
		expect(definition).toHaveBeenCalledTimes(1);
		const custom = document
			.getAnimations()
			.map((animation) => animation.effect as KeyframeEffect)
			.filter(
				(effect) =>
					effect.pseudoElement?.includes('view-transition-old(astra_view_') &&
					effect.getKeyframes().some((frame) => frame.filter)
			);
		expect(custom).toHaveLength(2);
		expect(custom[0].getKeyframes().map((frame) => frame.filter)).toEqual([
			'blur(2px)',
			'blur(0px)'
		]);
		expect(controls?.state).toBe('paused');
		controls?.complete();
	}
	await handle.finished;
	expect(complete).toHaveBeenCalledTimes(
		typeof document.startViewTransition === 'function' ? 1 : 0
	);
});

it('surfaces a throwing animation resolver and cleans up its capture', async () => {
	const error = new Error('invalid animation');
	const { component } = render(Fixture, {
		onTypes: () => {
			throw error;
		}
	});
	await tick();
	const handle = component.change();
	if (typeof document.startViewTransition === 'function') {
		await expect(handle.ready).rejects.toBe(error);
		await expect(handle.finished).rejects.toBe(error);
	} else await expect(handle.finished).resolves.toBe('unsupported');
	expect(card()?.querySelector('[data-view-count]')?.textContent).toBe('1');
	expect(document.querySelector('[data-astra-view-reset]')).toBeNull();
});
