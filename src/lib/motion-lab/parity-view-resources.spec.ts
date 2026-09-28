import { afterEach, expect, it, vi } from 'vitest';
import { captureViewResources, waitForViewResources } from '../motion/view-resources.js';

afterEach(() => vi.useRealTimers());

function fixture() {
	const image = Object.assign(new EventTarget(), {
		complete: false,
		src: '/card.webp',
		currentSrc: '',
		srcset: '',
		sizes: '',
		loading: 'eager',
		decoding: 'auto',
		getBoundingClientRect: () => ({ top: 20, left: 20, right: 120, bottom: 120 })
	}) as unknown as HTMLImageElement;
	const remove = vi.spyOn(image, 'removeEventListener');
	const images: HTMLImageElement[] = [];
	const document = {
		images,
		fonts: { status: 'loaded', ready: Promise.resolve() },
		defaultView: { innerWidth: 1000, innerHeight: 1000 },
		documentElement: { getBoundingClientRect: vi.fn() }
	} as unknown as Document;
	return { image, images, document, remove };
}

it('waits for a newly introduced visible image and removes both event listeners', async () => {
	const { image, images, document, remove } = fixture();
	const resources = captureViewResources(document);
	images.push(image);
	let done = false;
	const waiting = waitForViewResources(document, resources, new AbortController().signal).then(
		() => {
			done = true;
		}
	);
	await Promise.resolve();
	expect(done).toBe(false);
	image.dispatchEvent(new Event('load'));
	await waiting;
	expect(done).toBe(true);
	expect(remove.mock.calls.map(([event]) => event)).toEqual(['load', 'error']);
});

it('bounds resource waiting to 500ms and clears pending timers on cancellation', async () => {
	vi.useFakeTimers();
	const { image, images, document, remove } = fixture();
	const resources = captureViewResources(document);
	images.push(image);
	const controller = new AbortController();
	const waiting = waitForViewResources(document, resources, controller.signal);
	expect(vi.getTimerCount()).toBe(1);
	controller.abort();
	await waiting;
	expect(vi.getTimerCount()).toBe(0);
	expect(remove).toHaveBeenCalledTimes(2);
	const bounded = waitForViewResources(document, resources, new AbortController().signal);
	await vi.advanceTimersByTimeAsync(500);
	await bounded;
	expect(vi.getTimerCount()).toBe(0);
});

it('does not wait for old loads, lazy images, or offscreen images', async () => {
	const { image, images, document } = fixture();
	images.push(image);
	const resources = captureViewResources(document);
	const add = vi.spyOn(image, 'addEventListener');
	await waitForViewResources(document, resources, new AbortController().signal);
	expect(add).not.toHaveBeenCalled();
	image.src = '/next.webp';
	image.loading = 'lazy';
	await waitForViewResources(document, resources, new AbortController().signal);
	expect(add).not.toHaveBeenCalled();
	image.loading = 'eager';
	image.getBoundingClientRect = () => ({ top: 1100, left: 0, right: 20, bottom: 1120 }) as DOMRect;
	await waitForViewResources(document, resources, new AbortController().signal);
	expect(add).not.toHaveBeenCalled();
});
