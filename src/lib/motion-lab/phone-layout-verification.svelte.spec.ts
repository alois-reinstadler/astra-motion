import { expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
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
const animations = (root: HTMLElement) => [
	...new Set(
		[...root.querySelectorAll<HTMLElement>('*')].flatMap((node) => {
			const animation = visualElementStore.get(node)?.projection?.currentAnimation;
			return animation ? [animation] : [];
		})
	)
];

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
	return {
		container,
		async dispose() {
			container.remove();
			tail.remove();
			await page.viewport(previous.width, previous.height);
			window.scrollTo({ top: previous.scroll, behavior: 'instant' });
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
			if (first) await screen.getByRole('button', { name: 'Use grid' }).click();
			else await userEvent.keyboard('{Enter}');
			await tick();
			await frames();
			const running = animations(stage.container);
			expect(running.length).toBeGreaterThan(0);
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
			if (first) await screen.getByRole('button', { name: 'Use grid' }).click();
			else await userEvent.keyboard('{Enter}');
			await tick();
			await frames();
			const running = animations(stage.container);
			expect(running.length).toBeGreaterThan(0);
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
						!document
							.elementsFromPoint(x, y)
							.some((node) => node === detail || detail.contains(node))
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
			samples.push({
				time,
				opacity: Number(getComputedStyle(detail).opacity),
				card: box(card),
				detail: box(detail),
				outsideCharacters,
				visibleInside
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
	try {
		await document.fonts.ready;
		window.scrollTo({ top: 500, behavior: 'instant' });
		await frames();
		const card = stage.container.querySelector<HTMLElement>('.card')!;
		const demo = stage.container.querySelector<HTMLElement>('.demo')!;
		expect(card.getBoundingClientRect().top).toBeGreaterThan(0);
		expect(card.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
		const sample = () => ({ card: box(card), stage: box(demo), scrollY: window.scrollY });
		const capture = async (count: number) => {
			const samples = [sample()];
			for (let index = 0; index < count; index++) {
				await frame();
				samples.push(sample());
			}
			return samples;
		};
		const collapsed = sample();
		await screen.getByRole('button', { name: 'Read the note' }).click();
		await capture(60);
		const expanded = sample();
		await userEvent.keyboard('{Enter}');
		const close = await capture(90);
		await userEvent.keyboard('{Enter}');
		await capture(6);
		const interrupted = sample();
		await userEvent.keyboard('{Enter}');
		const reverse = await capture(90);
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
				)
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
		await screen.unmount();
		await stage.dispose();
	}
}, 15000);
