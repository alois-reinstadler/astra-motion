import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
	cancelFrame,
	frame as motionFrame,
	visualElementStore,
	type AnimationPlaybackControls
} from 'motion-dom';
import { beforeCommit } from '../motion/commit.js';
import Fixture from './ReleaseLayout.svelte';

const cell = (id: number) => document.querySelector<HTMLElement>(`[data-release-cell="${id}"]`);
const nodes = () => [...document.querySelectorAll<HTMLElement>('[data-release-cell]')];
const delay = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));
const frames = async (count = 2) => {
	for (let index = 0; index < count; index++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};
const rect = (node: HTMLElement) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height };
};
type Box = ReturnType<typeof rect>;
const error = (before: Box, after: Box) =>
	Math.max(
		...(['x', 'y', 'width', 'height'] as const).map((axis) => Math.abs(before[axis] - after[axis]))
	);
const controls = () =>
	new Set(
		nodes().flatMap((node) => {
			const animation = visualElementStore.get(node)?.projection?.currentAnimation;
			return animation ? [animation] : [];
		})
	);

async function settleInitial() {
	await tick();
	await expect.poll(() => nodes().length).toBe(30);
	await expect
		.poll(() => visualElementStore.get(cell(29)!)?.projection?.root.isUpdateBlocked())
		.toBe(false);
	// Mount projection and presence observers must have consumed their initial boxes.
	await frames(3);
}

/** Freeze starts at Motion's own preRender phase, before its render flush applies them. */
function captureStarts() {
	const previous = controls();
	const animations = new Set<AnimationPlaybackControls>();
	const capture = () => {
		for (const animation of controls()) {
			if (previous.has(animation) || animations.has(animation)) continue;
			animation.pause();
			animation.time = 0;
			animations.add(animation);
		}
	};
	motionFrame.preRender(capture, true);
	return { animations, stop: () => cancelFrame(capture) };
}

function firstPinned(ids: number[]) {
	const samples = new Map<number, Box>();
	const observe = () => {
		for (const id of ids) {
			const node = cell(id);
			if (node && !samples.has(id) && getComputedStyle(node).position === 'absolute')
				samples.set(id, rect(node));
		}
	};
	const observer = new MutationObserver(observe);
	observer.observe(document.body, { attributes: true, childList: true, subtree: true });
	return { samples, stop: () => observer.disconnect() };
}

async function expectIntermediate(
	starts: ReturnType<typeof captureStarts>,
	before: Box,
	survivor: HTMLElement
) {
	await expect.poll(() => starts.animations.size).toBeGreaterThan(0);
	starts.stop();
	for (const animation of starts.animations) animation.time = 0.09;
	await frames();
	const middle = rect(survivor);
	for (const animation of starts.animations) animation.complete();
	await frames();
	const final = rect(survivor);
	const axis = Math.abs(final.x - before.x) > Math.abs(final.y - before.y) ? 'x' : 'y';
	const low = Math.min(before[axis], final[axis]);
	const high = Math.max(before[axis], final[axis]);
	expect(high - low, 'survivor must have a meaningful layout displacement').toBeGreaterThan(10);
	expect(
		middle[axis],
		'numeric intermediate position must differ from the earlier endpoint'
	).toBeGreaterThan(low + 1);
	expect(
		middle[axis],
		'numeric intermediate position must differ from the destination'
	).toBeLessThan(high - 1);
}

for (const interrupted of [false, true]) {
	it(`ordinary state publication preserves first-pop origins and survivor motion (interrupted=${interrupted})`, async () => {
		const subscriptions = beforeCommit.size;
		const screen = render(Fixture);
		let pinned: ReturnType<typeof firstPinned> | undefined;
		let starts: ReturnType<typeof captureStarts> | undefined;
		try {
			await settleInitial();
			if (interrupted) {
				screen.component.reverse();
				await delay(90);
				expect(controls().size, 'reverse must create real projection motion').toBeGreaterThan(0);
				for (const animation of controls()) animation.pause();
				await frames();
			}
			const before = new Map([0, 5].map((id) => [id, rect(cell(id)!)]));
			const survivor = cell(1)!;
			const survivorBefore = rect(survivor);
			pinned = firstPinned([0, 5]);
			starts = captureStarts();
			screen.component.combined();
			await expect.poll(() => pinned!.samples.size).toBe(2);
			pinned.stop();
			for (const id of [0, 5])
				expect
					.soft(error(before.get(id)!, pinned.samples.get(id)!), `first pinned origin for ${id}`)
					.toBeLessThanOrEqual(0.75);
			await expectIntermediate(starts, survivorBefore, survivor);
			await expect.poll(() => cell(0)).toBeNull();
			await expect.poll(() => cell(5)).toBeNull();
			const expected = Array.from({ length: 30 }, (_, id) => id).filter(
				(id) => id !== 0 && id !== 5
			);
			if (!interrupted) expected.reverse();
			expect(nodes().map((node) => Number(node.dataset.releaseCell))).toEqual(expected);
			expect(document.querySelector('[data-astra-presence-pop]')).toBeNull();
		} finally {
			pinned?.stop();
			starts?.stop();
			await screen.unmount();
		}
		expect(beforeCommit.size).toBe(subscriptions);
		expect(nodes()).toHaveLength(0);
	});
}

it('tracks in-place reverse and splice without a state wrapper or identity replacement', async () => {
	const screen = render(Fixture);
	let starts: ReturnType<typeof captureStarts> | undefined;
	let pinned: ReturnType<typeof firstPinned> | undefined;
	try {
		await settleInitial();
		const survivor = cell(1)!;
		const before = rect(survivor);
		starts = captureStarts();
		screen.component.reverse();
		await expectIntermediate(starts, before, survivor);
		expect(nodes().map((node) => Number(node.dataset.releaseCell))).toEqual(
			Array.from({ length: 30 }, (_, id) => 29 - id)
		);
		const outgoingBefore = rect(cell(0)!);
		pinned = firstPinned([0]);
		screen.component.splice();
		await expect.poll(() => pinned!.samples.size).toBe(1);
		expect(error(outgoingBefore, pinned.samples.get(0)!)).toBeLessThanOrEqual(0.75);
		await expect.poll(() => cell(0)).toBeNull();
		expect(nodes().map((node) => Number(node.dataset.releaseCell))).toEqual(
			Array.from({ length: 29 }, (_, id) => 29 - id)
		);
	} finally {
		starts?.stop();
		pinned?.stop();
		await screen.unmount();
	}
	expect(nodes()).toHaveLength(0);
});

it('preserves the sampled pose when a promise-driven sibling reflow is interrupted by removal', async () => {
	const screen = render(Fixture);
	let opening: ReturnType<typeof captureStarts> | undefined;
	let starts: ReturnType<typeof captureStarts> | undefined;
	let pinned: ReturnType<typeof firstPinned> | undefined;
	try {
		await settleInitial();
		opening = captureStarts();
		screen.component.resolve();
		await expect.poll(() => document.querySelector('[data-release-ready]')).not.toBeNull();
		await expect.poll(() => opening!.animations.size).toBeGreaterThan(0);
		opening.stop();
		for (const animation of opening.animations) animation.time = 0.09;
		await frames();
		const before = new Map([0, 5].map((id) => [id, rect(cell(id)!)]));
		const survivor = cell(1)!;
		const survivorBefore = rect(survivor);
		pinned = firstPinned([0, 5]);
		starts = captureStarts();
		screen.component.remove();
		await expect.poll(() => pinned!.samples.size).toBe(2);
		pinned.stop();
		for (const id of [0, 5])
			expect
				.soft(
					error(before.get(id)!, pinned.samples.get(id)!),
					`promise-interrupted pinned origin for ${id}`
				)
				.toBeLessThanOrEqual(0.75);
		await expectIntermediate(starts, survivorBefore, survivor);
		await expect.poll(() => cell(0)).toBeNull();
		await expect.poll(() => cell(5)).toBeNull();
		expect(nodes().map((node) => Number(node.dataset.releaseCell))).toEqual(
			Array.from({ length: 30 }, (_, id) => id).filter((id) => id !== 0 && id !== 5)
		);
	} finally {
		opening?.stop();
		starts?.stop();
		pinned?.stop();
		await screen.unmount();
	}
	expect(nodes()).toHaveLength(0);
});

it('does not read layout rectangles for unrelated text updates after setup', async () => {
	const screen = render(Fixture);
	let measured: ReturnType<typeof vi.spyOn> | undefined;
	try {
		await settleInitial();
		measured = vi.spyOn(Element.prototype, 'getBoundingClientRect');
		screen.component.unrelated();
		await tick();
		await frames(3);
		expect(measured.mock.calls).toHaveLength(0);
		expect(document.querySelector('[data-release-unrelated]')?.textContent).toBe('1');
	} finally {
		measured?.mockRestore();
		await screen.unmount();
	}
});

it('releases pinned exit styles and snapshot subscriptions when unmounted during an exit', async () => {
	const subscriptions = beforeCommit.size;
	const popStyles = () =>
		[...document.querySelectorAll('style')].filter((style) =>
			style.textContent?.includes('[data-astra-presence-pop=')
		);
	const styles = popStyles().length;
	const screen = render(Fixture);
	try {
		await settleInitial();
		screen.component.combined();
		await expect.poll(() => document.querySelector('[data-astra-presence-pop]')).not.toBeNull();
		expect(popStyles().length).toBeGreaterThan(styles);
	} finally {
		await screen.unmount();
	}
	await frames();
	expect(beforeCommit.size).toBe(subscriptions);
	expect(popStyles()).toHaveLength(styles);
	expect(document.querySelector('[data-astra-presence-pop]')).toBeNull();
	expect(nodes()).toHaveLength(0);
});
