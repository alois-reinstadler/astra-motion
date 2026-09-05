import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScrollLab from './ScrollLab.svelte';
import ScrollRetention from './ScrollRetention.svelte';

const matrix = (node: Element) => new DOMMatrix(getComputedStyle(node).transform);
const settle = () =>
	new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);

it('tracks a container and reverses its linked animation without queued playback', async () => {
	const screen = render(ScrollLab);
	const container = screen.getByTestId('scroll-container').element() as HTMLElement;
	const fill = screen.getByTestId('scroll-fill').element();
	await expect.poll(() => matrix(fill).a).toBeCloseTo(0, 2);
	container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
	await expect.poll(() => screen.component.readProgress()).toBeCloseTo(0.5, 2);
	await expect.poll(() => matrix(fill).a).toBeCloseTo(0.5, 2);
	if ('ScrollTimeline' in window)
		expect(fill.getAnimations()[0]?.timeline?.constructor.name).toBe('ScrollTimeline');
	container.scrollTop = container.scrollHeight;
	await expect.poll(() => matrix(fill).a).toBeCloseTo(1, 2);
	container.scrollTop = 0;
	await expect.poll(() => matrix(fill).a).toBeCloseTo(0, 2);
});

it('tracks target offsets separately from its animated child', async () => {
	const screen = render(ScrollLab);
	const container = screen.getByTestId('scroll-container').element() as HTMLElement;
	const reveal = screen.getByTestId('scroll-reveal').element();
	await settle();
	const before = Number(getComputedStyle(reveal).opacity);
	container.scrollTop = container.scrollHeight;
	await expect.poll(() => Number(getComputedStyle(reveal).opacity)).toBeGreaterThan(0.95);
	expect(before).toBeLessThan(0.5);
});

it('tracks the horizontal axis', async () => {
	const screen = render(ScrollLab);
	const container = screen.getByTestId('horizontal-container').element() as HTMLElement;
	const marker = screen.getByTestId('scroll-marker').element();
	container.scrollLeft = container.scrollWidth;
	await expect.poll(() => matrix(marker).e).toBeCloseTo(240, 0);
	container.scrollLeft = 0;
	await expect.poll(() => matrix(marker).e).toBeCloseTo(0, 0);
});

it('finishes visual effects under reduced motion while retaining accurate semantic progress', async () => {
	const screen = render(ScrollLab);
	const container = screen.getByTestId('scroll-container').element() as HTMLElement;
	const fill = screen.getByTestId('scroll-fill').element();
	await screen.getByRole('button', { name: 'Reduced motion: off' }).click();
	await expect.poll(() => matrix(fill).a).toBeCloseTo(1, 2);
	container.scrollTop = (container.scrollHeight - container.clientHeight) / 3;
	await expect.poll(() => screen.component.readProgress()).toBeCloseTo(1 / 3, 2);
	expect(matrix(fill).a).toBeCloseTo(1, 2);
	await screen.getByRole('button', { name: 'Reduced motion: on' }).click();
	await expect.poll(() => matrix(fill).a).toBeCloseTo(1 / 3, 2);
});

it('cleans up detached participants and reconnects a new scroller', async () => {
	const screen = render(ScrollLab);
	const oldContainer = screen.getByTestId('scroll-container').element() as HTMLElement;
	const oldFill = screen.getByTestId('scroll-fill').element() as HTMLElement;
	const oldReveal = screen.getByTestId('scroll-reveal').element() as HTMLElement;
	oldFill.style.outline = '1px solid red';
	oldContainer.scrollTop = oldContainer.scrollHeight;
	await expect.poll(() => screen.component.readProgress()).toBeCloseTo(1, 2);
	await screen.getByRole('button', { name: 'Unmount scroller' }).click();
	await settle();
	expect(oldFill.getAnimations()).toHaveLength(0);
	expect(oldFill.style.transform).toBe('');
	expect(oldReveal.style.transform).toBe('');
	expect(oldReveal.style.opacity).toBe('');
	expect(oldFill.style.outline).toContain('red');
	oldContainer.scrollTop = 0;
	oldContainer.dispatchEvent(new Event('scroll'));
	await settle();
	expect(screen.component.readProgress()).toBeCloseTo(1, 2);
	await screen.getByRole('button', { name: 'Remount scroller' }).click();
	await expect.poll(() => screen.component.readProgress()).toBeCloseTo(0, 2);
});

it('updates the container range after resize and rapid direction changes', async () => {
	const screen = render(ScrollLab);
	const container = screen.getByTestId('scroll-container').element() as HTMLElement;
	const fill = screen.getByTestId('scroll-fill').element();
	container.scrollTop = 300;
	await expect.poll(() => screen.component.readProgress()).toBeGreaterThan(0);
	container.style.height = '280px';
	await expect
		.poll(() => screen.component.readProgress())
		.toBeCloseTo(300 / (container.scrollHeight - container.clientHeight), 2);
	for (let i = 0; i < 12; i++) {
		container.scrollTop = i % 2 ? container.scrollHeight : 0;
		await settle();
	}
	container.scrollTop = (container.scrollHeight - container.clientHeight) * 0.25;
	await expect.poll(() => matrix(fill).a).toBeCloseTo(0.25, 2);
});

it('applies inherited reduced-motion policy while a native outro retains a paused child', async () => {
	const screen = render(ScrollRetention);
	const fill = screen.getByTestId('retained-scroll-fill').element();
	await expect.poll(() => matrix(fill).a).toBeCloseTo(0, 2);
	await screen.getByRole('button', { name: 'Remove scrolling child' }).click();
	expect(fill.isConnected).toBe(true);
	await screen.getByRole('button', { name: 'Reduce scrolling child' }).click();
	await expect.poll(() => matrix(fill).a).toBeCloseTo(1, 2);
	expect(fill.isConnected).toBe(true);
	await expect.poll(() => fill.isConnected, { timeout: 2000 }).toBe(false);
});

it('applies a live OS reduction event while the child is retained by its outro', async () => {
	const media = matchMedia('(prefers-reduced-motion: reduce)');
	let reduced = false;
	Object.defineProperty(media, 'matches', { configurable: true, get: () => reduced });
	const mock = vi.spyOn(window, 'matchMedia').mockReturnValue(media);
	const screen = render(ScrollRetention);
	try {
		const fill = screen.getByTestId('retained-scroll-fill').element();
		await expect.poll(() => matrix(fill).a).toBeCloseTo(0, 2);
		await screen.getByRole('button', { name: 'Remove scrolling child' }).click();
		reduced = true;
		media.dispatchEvent(new MediaQueryListEvent('change', { matches: true, media: media.media }));
		await expect.poll(() => matrix(fill).a).toBeCloseTo(1, 2);
		expect(fill.isConnected).toBe(true);
	} finally {
		await screen.unmount();
		mock.mockRestore();
		Reflect.deleteProperty(media, 'matches');
	}
});
