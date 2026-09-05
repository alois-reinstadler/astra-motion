import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createAnimate } from '../motion/animate.js';
import { claimMotionOwnership, hasMotionOwnership } from '../motion/ownership.js';
import ScrollLab from './ScrollLab.svelte';
import ScrollWindowSoak from './ScrollWindowSoak.svelte';

const frames = async (count = 2) => {
	for (let index = 0; index < count; index++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
};

// These check 100 real mount/paint/cleanup cycles, not throughput. Concurrent
// browser engines can exceed 20s in WebKit while every lifecycle assertion passes.
const scrollSoakTimeout = 60_000;

it('releases every timeline owner and native playback across 120 interruption/remount cycles', async () => {
	const scope = createAnimate({ reducedMotion: 'never' });
	const nodes: HTMLElement[] = [];
	for (let index = 0; index < 120; index++) {
		const root = document.createElement('section');
		const node = document.createElement('div');
		node.style.cssText = 'width:20px;height:20px;opacity:1';
		root.append(node);
		document.body.append(root);
		nodes.push(node);
		const detach = scope.attach(root);
		try {
			scope.sequence([
				[node, { opacity: 0.3, x: 80 }, { duration: 0.1 }],
				[node, { opacity: 0, x: -80 }, { duration: 0.1 }]
			]);
			await frames(1);
			node.style.width = `${20 + (index % 4) * 10}px`;
			scope.animate(node, { opacity: 1, x: 0 }, { duration: 0.1 });
			if (index % 3 === 0) node.remove();
		} finally {
			detach?.();
			root.remove();
		}
		expect(scope.active).toBe(0);
		expect(hasMotionOwnership(node)).toBe(false);
		expect(node.getAnimations()).toHaveLength(0);
	}
	await frames(4);
	expect(nodes.filter(hasMotionOwnership)).toHaveLength(0);
	expect(nodes.flatMap((node) => node.getAnimations())).toHaveLength(0);
}, 15000);

it('prevents completed controls from writing after another motion owner takes over', async () => {
	const root = document.createElement('section');
	const node = document.createElement('div');
	root.append(node);
	document.body.append(root);
	const scope = createAnimate({ reducedMotion: 'never' });
	const detach = scope.attach(root);
	const controls = scope.animate(node, { opacity: [1, 0.2] }, { duration: 0.02 });
	await controls;
	const release = claimMotionOwnership(node, 'state', {});
	try {
		expect(() => {
			controls.time = 0;
		}).toThrow('state');
		expect(() => controls.complete()).toThrow('state');
	} finally {
		release();
		detach?.();
		root.remove();
	}
});

it('does not poll geometry while a settled scroll controller is idle', async () => {
	const screen = render(ScrollLab);
	await frames(8);
	const read = vi.spyOn(Element.prototype, 'getBoundingClientRect');
	try {
		await frames(12);
		expect(read).not.toHaveBeenCalled();
	} finally {
		read.mockRestore();
		await screen.unmount();
	}
});

it(
	'releases scroll listeners, styles and owners through 100 component mount/scroll/resize/unmount cycles',
	async () => {
		type Listener = EventListenerOrEventListenerObject;
		const tracked = new Map<EventTarget, Map<string, Set<Listener>>>();
		const add = EventTarget.prototype.addEventListener;
		const remove = EventTarget.prototype.removeEventListener;
		const accepts = (target: EventTarget, type: string) =>
			(type === 'scroll' || type === 'resize') &&
			(target instanceof HTMLElement || target === window);
		const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener').mockImplementation(function (
			this: EventTarget,
			type: string,
			listener: Listener | null,
			options?: boolean | AddEventListenerOptions
		) {
			if (listener && accepts(this, type)) {
				let events = tracked.get(this);
				if (!events) tracked.set(this, (events = new Map()));
				let handlers = events.get(type);
				if (!handlers) events.set(type, (handlers = new Set()));
				handlers.add(listener);
			}
			add.call(this, type, listener, options);
		});
		const removeSpy = vi
			.spyOn(EventTarget.prototype, 'removeEventListener')
			.mockImplementation(function (
				this: EventTarget,
				type: string,
				listener: Listener | null,
				options?: boolean | EventListenerOptions
			) {
				if (listener) tracked.get(this)?.get(type)?.delete(listener);
				remove.call(this, type, listener, options);
			});
		const removed: HTMLElement[] = [];
		try {
			for (let index = 0; index < 100; index++) {
				const screen = render(ScrollLab);
				const scroller = screen.getByTestId('scroll-container').element() as HTMLElement;
				const fill = screen.getByTestId('scroll-fill').element() as HTMLElement;
				const reveal = screen.getByTestId('scroll-reveal').element() as HTMLElement;
				const marker = screen.getByTestId('scroll-marker').element() as HTMLElement;
				try {
					await frames(1);
					scroller.scrollTop = 200;
					scroller.style.height = `${220 + (index % 4) * 20}px`;
					await frames(1);
					scroller.scrollTop = 0;
					removed.push(fill, reveal, marker);
				} finally {
					await screen.unmount();
				}
				expect(hasMotionOwnership(fill)).toBe(false);
				expect(fill.getAnimations()).toHaveLength(0);
			}
			await frames(5);
			expect(removed.filter(hasMotionOwnership)).toHaveLength(0);
			expect(removed.flatMap((node) => node.getAnimations())).toHaveLength(0);
			expect(removed.filter((node) => node.style.transform || node.style.opacity)).toHaveLength(0);
			const remaining = [...tracked.values()].flatMap((events) =>
				[...events.values()].map((listeners) => listeners.size)
			);
			expect(remaining.reduce((sum, size) => sum + size, 0)).toBe(0);
		} finally {
			addSpy.mockRestore();
			removeSpy.mockRestore();
		}
	},
	scrollSoakTimeout
);

it(
	'cleans up document-scroll tracking over 100 mount cycles',
	async () => {
		const scrollRoot = document.scrollingElement as HTMLElement;
		const spacer = document.createElement('div');
		spacer.style.height = '3000px';
		document.body.append(spacer);
		const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>([
			['scroll', new Set()],
			['resize', new Set()]
		]);
		const add = window.addEventListener;
		const remove = window.removeEventListener;
		const addSpy = vi
			.spyOn(window, 'addEventListener')
			.mockImplementation(function (type, listener, options) {
				listeners.get(type)?.add(listener);
				add.call(window, type, listener, options);
			});
		const removeSpy = vi
			.spyOn(window, 'removeEventListener')
			.mockImplementation(function (type, listener, options) {
				listeners.get(type)?.delete(listener);
				remove.call(window, type, listener, options);
			});
		try {
			for (let index = 0; index < 100; index++) {
				const screen = render(ScrollWindowSoak);
				const fill = screen.getByTestId('window-scroll-fill').element();
				try {
					scrollRoot.scrollTop = index % 2 ? 0 : 120;
					await frames(2);
					expect(screen.component.progress.get()).toBeCloseTo(
						scrollRoot.scrollTop / (scrollRoot.scrollHeight - scrollRoot.clientHeight),
						2
					);
					if (index === 0 && 'ScrollTimeline' in window)
						expect(fill.getAnimations()[0]?.timeline?.constructor.name).toBe('ScrollTimeline');
				} finally {
					await screen.unmount();
				}
				expect(hasMotionOwnership(fill)).toBe(false);
				expect(fill.getAnimations()).toHaveLength(0);
			}
			await frames(3);
			expect([...listeners.values()].reduce((sum, handlers) => sum + handlers.size, 0)).toBe(0);
		} finally {
			addSpy.mockRestore();
			removeSpy.mockRestore();
			scrollRoot.scrollTop = 0;
			spacer.remove();
		}
	},
	scrollSoakTimeout
);
