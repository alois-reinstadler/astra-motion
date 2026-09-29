import { expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import {
	visualElementStore,
	frame as motionFrame,
	cancelFrame,
	type AnimationPlaybackControls
} from 'motion-dom';
import Reorder from '../site/examples/ParityGestureReorder.svelte';
import Layout from '../site/examples/ParityLayoutExpand.svelte';
import '../../routes/layout.css';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const frames = async (count = 2) => {
	for (let index = 0; index < count; index++) await frame();
};
const box = (node: Element) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height, documentY: y + window.scrollY };
};
const textBox = (node: Element) => {
	const range = document.createRange();
	range.selectNodeContents(node);
	const { width, height } = range.getBoundingClientRect();
	return { width, height };
};
const paintedText = (detail: HTMLElement, card: HTMLElement) => {
	const bounds = card.getBoundingClientRect();
	const walker = document.createTreeWalker(detail, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	let outsideCharacters = 0;
	let visibleInside = 0;
	let text: Node | null;
	while ((text = walker.nextNode())) {
		for (let index = 0; index < (text.textContent?.length ?? 0); index++) {
			if (!text.textContent![index].trim()) continue;
			range.setStart(text, index);
			range.setEnd(text, index + 1);
			const character = range.getBoundingClientRect();
			const x = character.x + character.width / 2;
			const y = character.y + character.height / 2;
			if (
				!document.elementsFromPoint(x, y).some((node) => node === detail || detail.contains(node))
			)
				continue;
			if (
				x < bounds.left - 1.5 ||
				x > bounds.right + 1.5 ||
				y < bounds.top - 1.5 ||
				y > bounds.bottom + 1.5
			)
				outsideCharacters++;
			else visibleInside++;
		}
	}
	return { outsideCharacters, visibleInside };
};
const animations = (root: HTMLElement) => [
	...new Set(
		[...root.querySelectorAll<HTMLElement>('*')].flatMap((node) => {
			const animation = visualElementStore.get(node)?.projection?.currentAnimation;
			return animation ? [animation] : [];
		})
	)
];

async function captureProjectionAnimations(root: HTMLElement, trigger: () => Promise<unknown>) {
	const previous = new Set(animations(root));
	const captured = new Set<AnimationPlaybackControls>();
	const capture = () => {
		for (const animation of animations(root)) {
			if (previous.has(animation) || captured.has(animation)) continue;
			animation.pause();
			animation.time = 0;
			captured.add(animation);
		}
	};
	// Arm before trusted input crosses the browser transport. Projection's
	// microtask commit flushes update/preRender/render, but not postRender.
	// Capture in preRender before a delayed RAF can finish a short clock.
	motionFrame.preRender(capture, true);
	try {
		await trigger();
		await tick();
		await frames();
		expect(captured.size).toBeGreaterThan(0);
		return [...captured];
	} finally {
		cancelFrame(capture);
	}
}

async function phoneStage(scrolled = false) {
	const previous = { width: window.innerWidth, height: window.innerHeight, scroll: window.scrollY };
	await page.viewport(393, 852);
	const container = document.createElement('div');
	container.style.cssText = `width:317px;max-width:calc(100% - 48px);margin:${scrolled ? 650 : 24}px auto 0;`;
	const tail = document.createElement('div');
	tail.style.height = '1200px';
	document.body.append(container, tail);
	await document.fonts.ready;
	await frames();
	// These animation cases begin after the viewport resize quiet period.
	await new Promise((resolve) => setTimeout(resolve, 350));
	return {
		container,
		async dispose() {
			container.remove();
			tail.remove();
			await page.viewport(previous.width, previous.height);
			window.scrollTo({ top: previous.scroll, behavior: 'instant' });
			await frames();
			await new Promise((resolve) => setTimeout(resolve, 350));
		}
	};
}

it('keeps reorder labels and controls unscaled while list/grid width animates in both directions and reverses', async () => {
	const stage = await phoneStage();
	const screen = await render(Reorder, { target: stage.container });
	try {
		await document.fonts.ready;
		await frames();
		const handle = stage.container.querySelector<HTMLButtonElement>('[aria-label="Drag Outline"]')!;
		const item = handle.closest<HTMLElement>('.item')!;
		const earlier = item.querySelector<HTMLButtonElement>('[aria-label="Move Outline earlier"]')!;
		const intrinsic = { label: textBox(handle), action: textBox(earlier) };
		const samples: {
			phase: string;
			item: ReturnType<typeof box>;
			label: ReturnType<typeof textBox>;
			action: ReturnType<typeof textBox>;
		}[] = [];
		const starts: { before: ReturnType<typeof box>; after: ReturnType<typeof box> }[] = [];
		const sizeMotion: { from: number; middle: number; target: number }[] = [];
		const sample = (phase: string) => {
			const value = { phase, item: box(item), label: textBox(handle), action: textBox(earlier) };
			samples.push(value);
			return value;
		};
		const change = async (phase: string, finish: boolean, first = false) => {
			const before = box(item);
			const running = await captureProjectionAnimations(stage.container, () =>
				first
					? screen.getByRole('button', { name: 'Use grid' }).click()
					: userEvent.keyboard('{Enter}')
			);
			for (const animation of running) {
				animation.pause();
				animation.time = 0;
			}
			await frames();
			starts.push({ before, after: sample(`${phase}:start`).item });
			for (const animation of running) animation.time = 0.12;
			await frames();
			const middle = sample(`${phase}:middle`).item.width;
			sizeMotion.push({ from: before.width, middle, target: item.offsetWidth });
			if (finish) {
				for (const animation of running) animation.complete();
				await frames();
				sample(`${phase}:end`);
			}
		};
		await change('list-grid', true, true);
		await change('grid-list', false);
		await change('interrupted-list-grid', true);
		await change('grid-list-settled', true);
		const distortion = Math.max(
			...samples.flatMap((sample) =>
				(['label', 'action'] as const).flatMap((kind) =>
					(['width', 'height'] as const).map((axis) =>
						Math.abs(sample[kind][axis] - intrinsic[kind][axis])
					)
				)
			)
		);
		expect(distortion, JSON.stringify({ intrinsic, samples })).toBeLessThan(1.5);
		for (const { before, after } of starts)
			for (const axis of ['x', 'documentY', 'width', 'height'] as const)
				expect(Math.abs(before[axis] - after[axis]), `reversal ${axis}`).toBeLessThan(1.5);
		for (const { from, middle, target } of sizeMotion) {
			expect(Math.abs(from - target)).toBeGreaterThan(8);
			expect(middle).toBeGreaterThan(Math.min(from, target) + 1);
			expect(middle).toBeLessThan(Math.max(from, target) - 1);
		}
	} finally {
		await screen.unmount();
		await stage.dispose();
	}
}, 15000);

it('has no reachable horizontal scroll during list/grid changes and reversal while retaining vertical scroll and reorder', async () => {
	const stage = await phoneStage();
	const screen = await render(Reorder, { target: stage.container });
	try {
		await frames();
		const scroller = stage.container.querySelector<HTMLElement>('.scroll')!;
		const item = stage.container
			.querySelector('[aria-label="Drag Outline"]')!
			.closest<HTMLElement>('.item')!;
		const samples: {
			phase: string;
			time: number;
			reachableX: number;
			width: number;
			client: number;
		}[] = [];
		const probe = (phase: string, time: number) => {
			scroller.scrollLeft = 10000;
			samples.push({
				phase,
				time,
				reachableX: scroller.scrollLeft,
				width: scroller.scrollWidth,
				client: scroller.clientWidth
			});
			scroller.scrollLeft = 0;
		};
		const change = async (phase: string, finish: boolean, first = false) => {
			const before = box(item).width;
			const running = await captureProjectionAnimations(stage.container, () =>
				first
					? screen.getByRole('button', { name: 'Use grid' }).click()
					: userEvent.keyboard('{Enter}')
			);
			for (const animation of running) animation.pause();
			for (const time of [0, 0.04, 0.08, 0.12]) {
				for (const animation of running) animation.time = time;
				await frames();
				probe(phase, time);
			}
			const middle = box(item).width;
			expect(Math.abs(before - item.offsetWidth)).toBeGreaterThan(8);
			expect(middle).toBeGreaterThan(Math.min(before, item.offsetWidth) + 1);
			expect(middle).toBeLessThan(Math.max(before, item.offsetWidth) - 1);
			if (finish) {
				for (const animation of running) animation.complete();
				await frames();
				probe(`${phase}:end`, 1);
				scroller.scrollTop = 70;
				expect(scroller.scrollTop).toBeGreaterThan(60);
				scroller.scrollTop = 0;
			}
		};
		probe('initial', 0);
		await change('list-grid', true, true);
		await change('grid-list', false);
		await change('reversed-list-grid', true);
		await change('grid-list-settled', true);
		expect
			.soft(Math.max(...samples.map(({ reachableX }) => reachableX)), JSON.stringify(samples))
			.toBe(0);
		const later = stage.container.querySelector<HTMLButtonElement>(
			'[aria-label="Move Outline later"]'
		)!;
		later.focus();
		await userEvent.keyboard('{Enter}');
		await tick();
		expect(
			[...stage.container.querySelectorAll('.handle')].slice(0, 2).map((node) => node.textContent)
		).toEqual(['Research', 'Outline']);
		expect(document.activeElement).toBe(later);
		expect(stage.container.querySelector('.announcement')?.textContent).toBe(
			'Outline moved to position 2'
		);
	} finally {
		await screen.unmount();
		await stage.dispose();
	}
}, 15000);

it('keeps outgoing note text continuous and painted inside the card through its opacity exit and animated close', async () => {
	const stage = await phoneStage(true);
	const screen = await render(Layout, { target: stage.container });
	try {
		window.scrollTo({ top: 500, behavior: 'instant' });
		await frames();
		const card = stage.container.querySelector<HTMLElement>('.card')!;
		const collapsed = box(card);
		await screen.getByRole('button', { name: 'Read the note' }).click();
		await expect.poll(() => box(card).width).toBeCloseTo(310, 1);
		const detail = stage.container.querySelector<HTMLElement>('.detail')!;
		await expect.poll(() => Number(getComputedStyle(detail).opacity)).toBe(1);
		for (const animation of animations(stage.container)) animation.complete();
		await frames();
		const expanded = { card: box(card), detail: box(detail) };
		const toggle = stage.container.querySelector<HTMLButtonElement>('[aria-expanded]')!;
		toggle.focus();
		await userEvent.keyboard('{Enter}');
		await tick();
		await frames();
		const running = animations(stage.container);
		const fade = detail
			.getAnimations()
			.find((animation) =>
				(animation.effect as KeyframeEffect)
					.getKeyframes()
					.some((keyframe) => keyframe.opacity !== undefined)
			)!;
		expect(fade).toBeDefined();
		fade.pause();
		for (const animation of running) {
			animation.pause();
			animation.time = 0;
		}
		fade.currentTime = 0;
		await frames();
		const start = { card: box(card), detail: box(detail) };
		for (const axis of ['x', 'documentY', 'width', 'height'] as const) {
			expect
				.soft(
					Math.abs(start.card[axis] - expanded.card[axis]),
					`card ${axis}: ${JSON.stringify({ expanded, start })}`
				)
				.toBeLessThan(1.5);
			expect
				.soft(
					Math.abs(start.detail[axis] - expanded.detail[axis]),
					`detail ${axis}: ${JSON.stringify({ expanded, start })}`
				)
				.toBeLessThan(1.5);
		}
		const samples: {
			time: number;
			opacity: number;
			card: ReturnType<typeof box>;
			detail: ReturnType<typeof box>;
			outsideCharacters: number;
			visibleInside: number;
		}[] = [];
		for (const time of [0.03, 0.06, 0.09, 0.12, 0.15]) {
			for (const animation of running) animation.time = time;
			fade.currentTime = time * 1000;
			await frames();
			samples.push({
				time,
				opacity: Number(getComputedStyle(detail).opacity),
				card: box(card),
				detail: box(detail),
				...paintedText(detail, card)
			});
		}
		expect
			.soft(
				Math.max(...samples.map(({ outsideCharacters }) => outsideCharacters)),
				JSON.stringify(samples)
			)
			.toBe(0);
		expect(samples.every(({ opacity }) => opacity > 0 && opacity < 1)).toBe(true);
		expect(samples[0].opacity - samples.at(-1)!.opacity).toBeGreaterThan(0.5);
		expect
			.soft(
				samples.some(({ visibleInside }) => visibleInside > 0),
				JSON.stringify(samples)
			)
			.toBe(true);
		expect(document.activeElement).toBe(toggle);
		fade.finish();
		for (const animation of running) animation.complete();
		await expect.poll(() => stage.container.querySelector('.detail')).toBeNull();
		await frames();
		const closing = animations(stage.container);
		for (const animation of closing) {
			animation.pause();
			animation.time = 0.12;
		}
		await frames();
		const widths = [...samples.map(({ card }) => card.width), box(card).width];
		expect(
			widths.some((width) => width < expanded.card.width - 3 && width > collapsed.width + 3)
		).toBe(true);
		for (const animation of closing) animation.complete();
		await frames();
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(toggle);
		expect(Math.abs(box(card).width - collapsed.width)).toBeLessThan(1.5);
		expect(Math.abs(box(card).height - collapsed.height)).toBeLessThan(1.5);

		// Reopen during a later exit: a stale completion must not collapse the
		// reserved layout after the same retained paragraph has started entering.
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => box(card).width).toBeCloseTo(310, 1);
		const retained = stage.container.querySelector<HTMLElement>('.detail')!;
		await expect.poll(() => Number(getComputedStyle(retained).opacity)).toBe(1);
		for (const animation of animations(stage.container)) animation.complete();
		await frames();
		await userEvent.keyboard('{Enter}');
		await tick();
		await frames();
		const interruptedFade = retained
			.getAnimations()
			.find((animation) =>
				(animation.effect as KeyframeEffect)
					.getKeyframes()
					.some((keyframe) => keyframe.opacity !== undefined)
			)!;
		expect(interruptedFade).toBeDefined();
		interruptedFade.pause();
		interruptedFade.currentTime = 90;
		await frames();
		expect(Number(getComputedStyle(retained).opacity)).toBeGreaterThan(0);
		expect(Number(getComputedStyle(retained).opacity)).toBeLessThan(0.8);
		await userEvent.keyboard('{Enter}');
		await tick();
		expect(stage.container.querySelector('.detail')).toBe(retained);
		await expect.poll(() => Number(getComputedStyle(retained).opacity)).toBe(1);
		await expect.poll(() => box(card).width).toBeCloseTo(expanded.card.width, 1);
		for (const animation of animations(stage.container)) animation.complete();
		await frames();
		expect(Math.abs(box(card).height - expanded.card.height)).toBeLessThan(1.5);
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(toggle);
	} finally {
		await screen.unmount();
		await stage.dispose();
	}
}, 15000);

it('closes and reverses the narrow note without an intermediate growth or document-space jump', async () => {
	const stage = await phoneStage(true);
	const screen = await render(Layout, { target: stage.container });
	let recording = true;
	try {
		await document.fonts.ready;
		window.scrollTo({ top: 500, behavior: 'instant' });
		await frames();
		const card = stage.container.querySelector<HTMLElement>('.card')!;
		const demo = stage.container.querySelector<HTMLElement>('.demo')!;
		expect(card.getBoundingClientRect().top).toBeGreaterThan(0);
		expect(card.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
		const sample = () => ({ card: box(card), stage: box(demo), scrollY: window.scrollY });
		// Sample every painted frame until the actual animation lifecycle settles.
		// A fixed frame count both assumes a refresh rate and keeps slow engines
		// waiting long after the spring and presence exit have completed.
		const captureUntil = async (settled: () => boolean) => {
			const samples = [sample()];
			do {
				await frame();
				samples.push(sample());
			} while (recording && !settled());
			return samples;
		};
		const collapsed = sample();
		await screen.getByRole('button', { name: 'Read the note' }).click();
		await captureUntil(
			() =>
				animations(stage.container).length === 0 &&
				Math.abs(box(card).width - 310) < 0.5 &&
				Number(getComputedStyle(stage.container.querySelector('.detail')!).opacity) === 1
		);
		const expanded = sample();
		const closed = () =>
			!stage.container.querySelector('.detail') &&
			animations(stage.container).length === 0 &&
			Math.abs(box(card).width - collapsed.card.width) < 0.5 &&
			Math.abs(box(card).height - collapsed.card.height) < 0.5;
		// Record before the trusted input crosses the browser-control boundary;
		// the animation can otherwise finish before keyboard() returns.
		const closingFrames = captureUntil(closed);
		await userEvent.keyboard('{Enter}');
		const close = await closingFrames;
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => animations(stage.container).length).toBeGreaterThan(0);
		for (const animation of animations(stage.container)) {
			animation.pause();
			animation.time = 0.09;
		}
		await frames();
		let interrupted = sample();
		let capturedInterruption = false;
		const toggle = stage.container.querySelector<HTMLButtonElement>('[aria-expanded]')!;
		// Capture at the actual trusted activation, before the component handler.
		// The paused spring keeps this partial pose stable during keyboard transport.
		toggle.addEventListener(
			'click',
			() => {
				interrupted = sample();
				capturedInterruption = true;
			},
			{ capture: true, once: true }
		);
		const reversingFrames = captureUntil(closed);
		await userEvent.keyboard('{Enter}');
		expect(capturedInterruption).toBe(true);
		expect(interrupted.card.width).toBeGreaterThan(collapsed.card.width + 8);
		expect(interrupted.card.width).toBeLessThan(expanded.card.width - 8);
		const reverse = await reversingFrames;
		const settled = sample();
		const diagnostic = JSON.stringify({
			collapsed,
			expanded,
			interrupted,
			settled,
			close: close.filter((_, index) => index % 5 === 0),
			reverse: reverse.filter((_, index) => index % 5 === 0)
		});
		expect(expanded.card.width - collapsed.card.width).toBeGreaterThan(50);
		expect(expanded.card.height - collapsed.card.height).toBeGreaterThan(20);
		for (const [start, samples] of [
			[expanded, close],
			[interrupted, reverse]
		] as const) {
			for (const axis of ['width', 'height', 'documentY'] as const) {
				const low = Math.min(start.card[axis], collapsed.card[axis]) - 2;
				const high = Math.max(start.card[axis], collapsed.card[axis]) + 2;
				expect(
					Math.min(...samples.map(({ card }) => card[axis])),
					`${axis}: ${diagnostic}`
				).toBeGreaterThanOrEqual(low);
				expect(
					Math.max(...samples.map(({ card }) => card[axis])),
					`${axis}: ${diagnostic}`
				).toBeLessThanOrEqual(high);
			}
			expect(
				samples.some(
					({ card }) => card.width < start.card.width - 3 && card.width > collapsed.card.width + 3
				),
				diagnostic
			).toBe(true);
		}
		expect(
			Math.max(...close.map(({ scrollY }) => scrollY)) -
				Math.min(...close.map(({ scrollY }) => scrollY)),
			diagnostic
		).toBeLessThan(1);
		expect(Math.abs(settled.card.width - collapsed.card.width)).toBeLessThan(1.5);
		expect(Math.abs(settled.card.height - collapsed.card.height)).toBeLessThan(1.5);
		expect(stage.container.querySelector('.detail')).toBeNull();
		expect(
			screen.getByRole('button', { name: 'Read the note' }).element().getAttribute('aria-expanded')
		).toBe('false');
	} finally {
		recording = false;
		await screen.unmount();
		await stage.dispose();
	}
}, 15000);

it('keeps partially entered text continuous and visibly fading inside a note closed before expansion finishes', async () => {
	const stage = await phoneStage(true);
	const screen = await render(Layout, { target: stage.container });
	try {
		window.scrollTo({ top: 500, behavior: 'instant' });
		await frames();
		const card = stage.container.querySelector<HTMLElement>('.card')!;
		// The phone viewport change intentionally blocks Motion projection until
		// its resize debounce ends; this case needs a running opening animation.
		await expect
			.poll(() => visualElementStore.get(card)?.projection?.root.isUpdateBlocked())
			.toBe(false);
		const collapsed = box(card);
		// Match the settled open/close cycle used by the existing interruption
		// regression before sampling the next opening at an exact active time.
		await screen.getByRole('button', { name: 'Read the note' }).click();
		await expect.poll(() => box(card).width).toBeCloseTo(310, 1);
		await expect
			.poll(() => Number(getComputedStyle(stage.container.querySelector('.detail')!).opacity))
			.toBe(1);
		for (const animation of animations(stage.container)) animation.complete();
		await frames();
		const toggle = stage.container.querySelector<HTMLButtonElement>('[aria-expanded]')!;
		toggle.focus();
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => stage.container.querySelector('.detail')).toBeNull();
		await frames();
		for (const animation of animations(stage.container)) animation.complete();
		await frames();
		expect(Math.abs(box(card).width - collapsed.width)).toBeLessThan(1.5);
		await expect.poll(() => visualElementStore.get(card)?.projection?.layout).toBeDefined();
		toggle.click();
		await tick();
		await expect
			.poll(() => Boolean(visualElementStore.get(card)?.projection?.currentAnimation))
			.toBe(true);
		const opening = animations(stage.container);
		expect(opening.length).toBeGreaterThan(0);
		for (const animation of opening) animation.pause();
		const detail = stage.container.querySelector<HTMLElement>('.detail')!;
		const opacityAnimation = () =>
			visualElementStore.get(detail)?.getValue('opacity')?.animation as
				AnimationPlaybackControls | undefined;
		await expect.poll(() => Boolean(opacityAnimation())).toBe(true);
		const entering = opacityAnimation()!;
		expect(entering).toBeDefined();
		entering.pause();
		entering.time = 0.09;
		for (const animation of opening) animation.time = 0.09;
		await frames();
		// Close a live partial entry. Motion samples native interruption from its
		// start time, so resume the seeked opacity and await the browser's clock
		// before capturing it; a raw paused WAAPI seek leaves those clocks apart.
		entering.play();
		await Promise.all(detail.getAnimations().map((animation) => animation.ready));
		const before = {
			card: box(card),
			detail: box(detail),
			opacity: Number(getComputedStyle(detail).opacity),
			...paintedText(detail, card)
		};
		expect(before.card.width).toBeGreaterThan(collapsed.width + 8);
		expect(before.card.width).toBeLessThan(302);
		expect(before.opacity).toBeGreaterThan(0);
		expect(before.opacity).toBeLessThan(1);
		expect(before.outsideCharacters).toBe(0);
		expect(before.visibleInside).toBeGreaterThan(0);
		toggle.focus();
		toggle.click();
		await tick();
		await frames();
		await expect.poll(() => Boolean(opacityAnimation())).toBe(true);
		const exiting = opacityAnimation()!;
		expect(exiting).toBeDefined();
		exiting.pause();
		exiting.time = 0;
		const closing = animations(stage.container);
		for (const animation of closing) {
			animation.pause();
			animation.time = 0;
		}
		await frames();
		const start = { card: box(card), detail: box(detail) };
		for (const axis of ['x', 'documentY', 'width', 'height'] as const) {
			expect(
				Math.abs(start.card[axis] - before.card[axis]),
				JSON.stringify({ before, start })
			).toBeLessThan(1.5);
			expect
				.soft(
					Math.abs(start.detail[axis] - before.detail[axis]),
					`early-close detail ${axis}: ${JSON.stringify({ before, start })}`
				)
				.toBeLessThan(1.5);
		}
		const samples = [];
		for (const time of [30, 90, 150]) {
			exiting.time = time / 1000;
			for (const animation of closing) animation.time = time / 1000;
			await frames();
			const control = toggle.getBoundingClientRect();
			const hit = document.elementFromPoint(
				control.x + control.width / 2,
				control.y + control.height / 2
			);
			samples.push({
				time,
				opacity: Number(getComputedStyle(detail).opacity),
				toggleReachable: hit === toggle || (!!hit && toggle.contains(hit)),
				toggleHit: hit?.className,
				...paintedText(detail, card)
			});
		}
		console.info('Early-close note geometry', JSON.stringify({ before, start, samples }));
		expect(
			samples.map(({ toggleReachable }) => toggleReachable),
			JSON.stringify(samples)
		).toEqual(samples.map(() => true));
		expect(samples.every(({ opacity }) => opacity > 0 && opacity < before.opacity)).toBe(true);
		expect(samples[0].opacity - samples.at(-1)!.opacity).toBeGreaterThan(0.2);
		expect(
			samples.every(({ outsideCharacters }) => outsideCharacters === 0),
			JSON.stringify(samples)
		).toBe(true);
		expect(
			samples.every(({ visibleInside }) => visibleInside > 0),
			JSON.stringify(samples)
		).toBe(true);
		expect(
			samples.map(({ visibleInside }) => visibleInside),
			JSON.stringify(samples)
		).toEqual(samples.map(() => before.visibleInside));
		expect(document.activeElement).toBe(toggle);
		exiting.complete();
		for (const animation of closing) animation.complete();
		await expect.poll(() => stage.container.querySelector('.detail')).toBeNull();
		await frames();
		for (const animation of animations(stage.container)) animation.complete();
		await frames();
		expect(Math.abs(box(card).width - collapsed.width)).toBeLessThan(1.5);
		expect(Math.abs(box(card).height - collapsed.height)).toBeLessThan(1.5);
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(toggle);

		// A trusted pointer click must reopen the same paragraph while an early
		// exit is paused; keyboard focus alone does not establish pointer access.
		toggle.click();
		await tick();
		await expect
			.poll(() => Boolean(visualElementStore.get(card)?.projection?.currentAnimation))
			.toBe(true);
		for (const animation of animations(stage.container)) {
			animation.pause();
			animation.time = 0.09;
		}
		const retained = stage.container.querySelector<HTMLElement>('.detail')!;
		const retainedOpacity = () =>
			visualElementStore.get(retained)?.getValue('opacity')?.animation as
				AnimationPlaybackControls | undefined;
		await expect.poll(() => Boolean(retainedOpacity())).toBe(true);
		retainedOpacity()!.pause();
		retainedOpacity()!.time = 0.09;
		await frames();
		expect(box(card).width).toBeGreaterThan(collapsed.width + 8);
		expect(box(card).width).toBeLessThan(302);
		retainedOpacity()!.play();
		await Promise.all(retained.getAnimations().map((animation) => animation.ready));
		toggle.click();
		await tick();
		await expect.poll(() => Boolean(retainedOpacity())).toBe(true);
		retainedOpacity()!.pause();
		retainedOpacity()!.time = 0.09;
		for (const animation of animations(stage.container)) animation.pause();
		await frames();
		expect(Number(getComputedStyle(retained).opacity)).toBeGreaterThan(0);
		expect(Number(getComputedStyle(retained).opacity)).toBeLessThan(0.8);
		let trustedClick = false;
		toggle.addEventListener(
			'click',
			(event) => {
				trustedClick = event.isTrusted;
			},
			{ once: true }
		);
		await screen.getByRole('button', { name: 'Read the note', exact: true }).click();
		expect(trustedClick).toBe(true);
		expect(stage.container.querySelector('.detail')).toBe(retained);
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		await expect.poll(() => Number(getComputedStyle(retained).opacity)).toBe(1);
		for (const animation of animations(stage.container)) animation.complete();
		await frames();
		expect(Math.abs(box(card).width - 310)).toBeLessThan(1.5);
		expect(document.activeElement).toBe(toggle);
	} finally {
		await screen.unmount();
		await stage.dispose();
	}
}, 15000);
