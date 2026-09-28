import { afterEach, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { frame, motionValue, svgSubjectEffect } from 'motion-dom';
import Harness from './parity-values-harness.svelte';

const frames = async (count = 3) => {
	for (let i = 0; i < count; i++) {
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		await tick();
	}
};
afterEach(() => vi.restoreAllMocks());

it('reacts to MotionValues, Svelte getters, conditional dependencies and output maps', async () => {
	const source = motionValue(4),
		replacement = motionValue(6);
	const screen = render(Harness, { source });
	await tick();
	const api = screen.component.getApi();
	expect(api.derived.get()).toBe(12);
	expect(api.template.get()).toBe('translate(12px) 0');
	const unchanged = api.derived;
	source.set(5);
	source.set(8);
	await frames();
	expect(api.derived.get()).toBe(24);
	expect(api.template.get()).toBe('translate(24px) 0');
	expect(api.changes).toEqual([5, 8]);
	screen.component.configure({ factor: 2, alternate: true, suffix: '%' });
	await tick();
	expect(api.conditional.get()).toBe(10);
	expect(api.derived.get()).toBe(16);
	api.alternate.set(12);
	await frames();
	expect(api.conditional.get()).toBe(12);
	expect(api.tuple.get()).toBe(14);
	screen.component.select(replacement);
	await tick();
	expect(api.derived).toBe(unchanged);
	expect(api.derived.get()).toBe(12);
	await frames();
	expect(api.template.get()).toBe('translate(12%) 0');
	source.set(100);
	await frames();
	expect(api.derived.get()).toBe(12);
	expect(api.changes).toEqual([5, 8]);
	replacement.set(20);
	await frames();
	expect(api.mapped.get()).toBe(1);
	screen.component.configure({ clamp: false, maximum: 5 });
	await tick();
	expect(api.mapped.get()).toBe(4);
	api.owned.set(5);
	await frames();
	expect(api.multiple.opacity.get()).toBe(0.5);
	expect(api.multiple.color.get()).toMatch(/^rgba?\(/);
	await screen.unmount();
	source.destroy();
	replacement.destroy();
});

it('removes subscriptions and pending derived work while preserving borrowed sources', async () => {
	const source = motionValue(0);
	const live = new Set<object>();
	const original = source.on.bind(source);
	vi.spyOn(source, 'on').mockImplementation((event, callback) => {
		const token = {};
		live.add(token);
		const stop = original(event, callback);
		return () => {
			live.delete(token);
			stop();
		};
	});
	const screen = render(Harness, { source });
	await tick();
	const api = screen.component.getApi(),
		destroyed = vi.fn();
	api.derived.on('destroy', destroyed);
	expect(live.size).toBeGreaterThan(0);
	source.set(20);
	await screen.unmount();
	const last = api.derived.get();
	expect(destroyed).toHaveBeenCalledOnce();
	expect(live.size).toBe(0);
	source.set(30);
	await frames();
	expect(api.derived.get()).toBe(last);
	expect(source.get()).toBe(30);
	expect(api.smooth.isAnimating()).toBe(false);
	source.destroy();
});

it('springs to reactive targets, preserves string units and accepts durations in seconds', async () => {
	const source = motionValue(0);
	const screen = render(Harness, { source });
	await tick();
	const api = screen.component.getApi();
	api.units.set('20px');
	expect(api.unitSpring.get()).toBe('20px');
	api.units.set('30px');
	expect(api.unitSpring.get()).toBe('20px');
	await expect.poll(() => api.unitSpring.get()).toBe('30px');
	screen.component.configure({ spring: { duration: 0.3, bounce: 0 } });
	await tick();
	source.set(100);
	await frames(3);
	expect(api.smooth.get()).toBeGreaterThan(0);
	expect(api.smooth.get()).toBeLessThan(100);
	await expect.poll(() => api.smooth.get()).toBe(100);
	const replacement = motionValue(30);
	screen.component.select(replacement);
	await tick();
	await expect.poll(() => api.smooth.get()).toBe(30);
	source.set(200);
	await frames();
	expect(api.smooth.get()).toBe(30);
	api.directSpring.set(100);
	await frames();
	expect(api.directSpring.isAnimating()).toBe(true);
	api.directSpring.jump(50);
	expect(api.directSpring.get()).toBe(50);
	expect(api.directSpring.getVelocity()).toBe(0);
	expect(api.directSpring.isAnimating()).toBe(false);
	await screen.unmount();
	source.destroy();
	replacement.destroy();
});

it('derives per-second velocity and returns to zero without retaining frame work', async () => {
	const source = motionValue(0);
	const screen = render(Harness, { source });
	await tick();
	const api = screen.component.getApi(),
		velocities: number[] = [];
	api.velocity.on('change', (value) => velocities.push(value));
	await frames();
	await new Promise<void>((resolve) =>
		frame.update(() => {
			source.setWithVelocity(0, 20, 10);
			frame.postRender(() => resolve());
		})
	);
	expect(velocities).toContain(2000);
	await expect.poll(() => api.velocity.get()).toBe(0);
	await expect.poll(() => api.acceleration.get()).toBe(0);
	await screen.unmount();
	const count = velocities.length;
	source.setWithVelocity(20, 50, 10);
	await frames();
	expect(velocities).toHaveLength(count);
	source.destroy();
});

it('starts time at zero, disables callbacks and suspends helper effects in hidden activity', async () => {
	const source = motionValue(2);
	const screen = render(Harness, { source });
	await tick();
	const api = screen.component.getApi();
	await frames(3);
	expect(api.frames.length).toBeGreaterThan(0);
	expect(api.frames[0][0]).toBe(0);
	expect(api.frames.every(([, delta]) => delta > 0)).toBe(true);
	expect(api.time.get()).toBeGreaterThan(0);
	screen.component.configure({ enabled: false });
	await tick();
	const frameCount = api.frames.length;
	await frames();
	expect(api.frames).toHaveLength(frameCount);
	screen.component.configure({ visible: false });
	await tick();
	const time = api.time.get(),
		derived = api.derived.get();
	source.set(20);
	await frames();
	expect(api.time.get()).toBe(time);
	expect(api.derived.get()).toBe(derived);
	screen.component.configure({ visible: true, enabled: true });
	await tick();
	await frames();
	expect(api.derived.get()).toBe(60);
	expect(api.frames.length).toBeGreaterThan(frameCount);
	await screen.unmount();
	const finalFrames = api.frames.length;
	await frames();
	expect(api.frames).toHaveLength(finalFrames);
	source.destroy();
});

it('updates page visibility and live reduced-motion preference and releases media listeners', async () => {
	let hidden = false;
	vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
	let matches = false;
	const listeners = new Set<() => void>();
	vi.spyOn(window, 'matchMedia').mockImplementation((media) => ({
		media,
		get matches() {
			return matches;
		},
		onchange: null,
		addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
			listeners.add(listener as () => void),
		removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) =>
			listeners.delete(listener as () => void),
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => true
	}));
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi();
	expect(api.page.current).toBe(true);
	expect(api.reduced.current).toBe(false);
	hidden = true;
	document.dispatchEvent(new Event('visibilitychange'));
	matches = true;
	for (const listener of listeners) listener();
	await tick();
	expect(api.page.current).toBe(false);
	expect(api.reduced.current).toBe(true);
	const count = api.frames.length;
	await frames();
	expect(api.frames).toHaveLength(count);
	hidden = false;
	document.dispatchEvent(new Event('visibilitychange'));
	await tick();
	await frames();
	expect(api.page.current).toBe(true);
	expect(api.frames.length).toBeGreaterThan(count);
	await screen.unmount();
	expect(listeners.size).toBe(0);
});

it('tracks both scroll axes, reactive offsets, content changes and replacement containers', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi(),
		values = api.scroll;
	const scroller = api.scroller!;
	scroller.scrollTo(100, 200);
	await expect.poll(() => scroller.scrollLeft).toBeGreaterThan(0);
	await expect.poll(() => values.scrollX.get()).toBe(scroller.scrollLeft);
	await expect.poll(() => values.scrollY.get()).toBe(scroller.scrollTop);
	expect(values.scrollXProgress.get()).toBeCloseTo(
		scroller.scrollLeft / (scroller.scrollWidth - scroller.clientWidth),
		4
	);
	expect(values.scrollYProgress.get()).toBeCloseTo(
		scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight),
		4
	);
	screen.component.configure({ offset: [0, 0.5], trackContentSize: true });
	await tick();
	await expect.poll(() => values.scrollYProgress.get()).toBeGreaterThan(0.9);
	api.target!.style.height = '900px';
	await expect.poll(() => values.scrollYProgress.get()).toBeLessThan(0.6);
	screen.component.configure({ showScroller: false });
	await tick();
	const last = values.scrollY.get();
	scroller.scrollTop = 0;
	scroller.dispatchEvent(new Event('scroll'));
	await frames();
	expect(values.scrollY.get()).toBe(last);
	screen.component.configure({ showScroller: true });
	await tick();
	expect(api.scroller).not.toBe(scroller);
	await expect.poll(() => values.scrollY.get()).toBe(0);
	expect(screen.component.getApi().scroll.scrollY).toBe(values.scrollY);
	await screen.unmount();
});

it('scopes selectors while animating values, objects, SVG and mixed sequences through one engine', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi(),
		source = motionValue(0),
		object = { amount: 0 };
	const external = document.createElement('div');
	external.className = 'subject';
	external.style.opacity = '1';
	document.body.append(external);
	try {
		await api.animate([
			['.subject', { opacity: 0.4 }, { duration: 0.03 }],
			[source, 20, { duration: 0.03, at: '<' }],
			[object, { amount: 10 }, { duration: 0.03, at: '<' }],
			['circle', { r: 15 }, { duration: 0.03, at: '<' }]
		]);
		expect(source.get()).toBe(20);
		expect(object.amount).toBe(10);
		expect(getComputedStyle(external).opacity).toBe('1');
		expect(getComputedStyle(api.scope.current!.querySelector('.subject')!).opacity).toBe('0.4');
		// Motion's SVG effect uses CSS for geometry properties supported by style.
		const circle = api.scope.current!.querySelector('circle')!;
		expect(getComputedStyle(circle).r).toBe('15px');
		await api.animate(circle, { attrR: 18 }, { duration: 0.03 });
		expect(circle.getAttribute('r')).toBe('18');
		await api.animate(external, { opacity: 0.6 }, { duration: 0.03 });
		expect(getComputedStyle(external).opacity).toBe('0.6');
		await api.animate('.motion-subject', { x: 30 }, { duration: 0.03 });
		expect(api.derived.get()).toBe(30);
		expect(api.scope.active).toBe(0);
	} finally {
		external.remove();
		source.destroy();
		await screen.unmount();
	}
});

it('owns replayed and paused controls and rejects disposed controls', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi();
	const controls = api.animate('.subject', { opacity: [1, 0.2] }, { duration: 0.03 });
	await controls;
	expect(api.scope.active).toBe(0);
	controls.play();
	expect(api.scope.active).toBe(1);
	controls.pause();
	await frames();
	expect(api.scope.active).toBe(1);
	api.scope.stop();
	expect(api.scope.active).toBe(0);
	expect(() => controls.play()).toThrow('stopped');
	const infinite = api.animate(
		'.subject',
		{ opacity: [1, 0.3] },
		{ duration: 1, repeat: Infinity }
	);
	await frames();
	const root = api.scope.current!;
	await screen.unmount();
	expect(root.getAnimations({ subtree: true })).toHaveLength(0);
	expect(() => infinite.play()).toThrow(/detached|stopped/);
});

it('applies live reduced motion to position while allowing opacity playback to continue', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi();
	const controls = api.animate(
		'.subject',
		{ x: 100, opacity: 0.2 },
		{ duration: 1, ease: 'linear' }
	);
	await frames();
	screen.component.configure({ reduce: 'always' });
	await tick();
	await frames();
	const element = api.scope.current!.querySelector('.subject')!;
	expect(new DOMMatrix(getComputedStyle(element).transform).e).toBeCloseTo(100, 2);
	expect(Number(getComputedStyle(element).opacity)).toBeGreaterThan(0.2);
	controls.complete();
	await controls;
	expect(getComputedStyle(element).opacity).toBe('0.2');
	await screen.unmount();
});

it.each(['hybrid', 'mini'] as const)(
	'%s playback pauses in Activity, resumes the same run, and preserves explicit pauses',
	async (kind) => {
		const screen = render(Harness);
		await tick();
		const api = screen.component.getApi();
		const animate = kind === 'mini' ? api.animateMini : api.animate;
		const selector = kind === 'mini' ? '.mini-subject' : '.subject';
		const controls = animate(selector, { opacity: [1, 0.2] }, { duration: 10, ease: 'linear' });
		const manuallyPaused = animate(
			selector,
			{ backgroundColor: ['#000', '#fff'] },
			{ duration: 10, autoplay: false }
		);
		await frames(3);
		await expect.poll(() => controls.time).toBeGreaterThan(0);
		screen.component.configure({ visible: false });
		await tick();
		await frames(1);
		const hiddenTime = controls.time;
		expect(hiddenTime).toBeGreaterThan(0);
		expect(controls.state).toBe('paused');
		await frames(4);
		expect(controls.time).toBe(hiddenTime);
		screen.component.configure({ visible: true });
		await tick();
		await frames(3);
		expect(controls.time).toBeGreaterThan(hiddenTime);
		expect(manuallyPaused.state).toBe('paused');
		screen.component.configure({ visible: false });
		await tick();
		controls.pause();
		await frames(1);
		const pausedTime = controls.time;
		screen.component.configure({ visible: true });
		await tick();
		await frames(3);
		expect(controls.state).toBe('paused');
		expect(controls.time).toBe(pausedTime);
		controls.play();
		await frames(3);
		expect(controls.time).toBeGreaterThan(pausedTime);
		controls.complete();
		await controls;
		await screen.unmount();
	}
);

it('mini completion settles infinite and frozen playback while preserving replay', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi();
	const controls = api.animateMini(
		'.mini-subject',
		{ opacity: [1, 0.2] },
		{ duration: 0.2, repeat: Infinity, ease: 'linear' }
	);
	await frames();
	controls.speed = 0;
	controls.complete();
	await controls;
	const subject = api.miniScope.current!.querySelector('.mini-subject')!;
	expect(getComputedStyle(subject).opacity).toBe('0.2');
	expect(api.miniScope.active).toBe(0);
	controls.speed = 1;
	controls.play();
	await frames();
	expect(controls.state).toBe('running');
	expect(Number(getComputedStyle(subject).opacity)).toBeGreaterThan(0.2);
	await screen.unmount();
	expect(subject.getAnimations()).toHaveLength(0);
});

it('retargets accelerated scroll-linked styles and suspends them with Activity', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi();
	const subject = document.querySelector('.scroll-linked')!;
	api.scroller!.scrollTop = 200;
	await expect.poll(() => Number(getComputedStyle(subject).opacity)).toBeCloseTo(0.5, 2);
	screen.component.configure({ offset: [0, 0.5] });
	await tick();
	await expect.poll(() => Number(getComputedStyle(subject).opacity)).toBeCloseTo(1, 2);
	screen.component.configure({ showScroller: false });
	await tick();
	screen.component.configure({ showScroller: true });
	await tick();
	await expect.poll(() => Number(getComputedStyle(subject).opacity)).toBe(0);
	api.scroller!.scrollTop = 100;
	await expect.poll(() => Number(getComputedStyle(subject).opacity)).toBeCloseTo(0.5, 2);
	screen.component.configure({ visible: false });
	await tick();
	const hidden = getComputedStyle(subject).opacity;
	api.scroller!.scrollTop = 200;
	await frames();
	expect(getComputedStyle(subject).opacity).toBe(hidden);
	screen.component.configure({ visible: true });
	await tick();
	await expect.poll(() => Number(getComputedStyle(subject).opacity)).toBe(1);
	await screen.unmount();
});

it.each(['hybrid', 'mini'] as const)(
	'%s external timeline subscriptions are disposed on explicit detach and owner teardown',
	async (kind) => {
		const screen = render(Harness);
		await tick();
		const api = screen.component.getApi();
		const animate = kind === 'mini' ? api.animateMini : api.animate;
		const selector = kind === 'mini' ? '.mini-subject' : '.subject';
		const progress = motionValue(0);
		let listeners = 0;
		const observe = (animation: { pause(): void; time: number }) => {
			animation.pause();
			listeners++;
			const stop = progress.on('change', (value) => (animation.time = value));
			return () => {
				listeners--;
				stop();
			};
		};
		const first = animate(selector, { opacity: [1, 0.2] }, { duration: 1 });
		const detach = first.attachTimeline({ observe });
		await frames();
		expect(listeners).toBe(1);
		progress.set(0.5);
		expect(first.time).toBe(0.5);
		screen.component.configure({ visible: false });
		await tick();
		expect(listeners).toBe(0);
		progress.set(0.8);
		expect(first.time).toBe(0.5);
		screen.component.configure({ visible: true });
		await tick();
		expect(listeners).toBe(1);
		progress.set(0.6);
		expect(first.time).toBe(0.6);
		detach();
		expect(listeners).toBe(0);
		const second = animate(selector, { opacity: [1, 0.2] }, { duration: 1 });
		second.attachTimeline({ observe });
		await frames();
		expect(listeners).toBe(1);
		await screen.unmount();
		expect(listeners).toBe(0);
		progress.destroy();
	}
);

it('serializes numeric SVG geometry without replacing engine values or changing units and objects', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi();
	const circle = api.scope.current!.querySelector('circle')!;
	const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
	ellipse.setAttribute('rx', '2');
	ellipse.setAttribute('ry', '3');
	circle.parentElement!.append(ellipse);
	try {
		await api.animate(circle, { r: [10, 20, 12], cx: 25 }, { duration: 0.06 });
		expect(getComputedStyle(circle).r).toBe('12px');
		expect(getComputedStyle(circle).cx).toBe('25px');
		const value = svgSubjectEffect.get(circle, 'r')!;
		expect(value.get()).toBe(12);
		await api.animate(circle, { r: '18px' }, { duration: 0.03 });
		expect(circle.style.r).toBe('18px');
		expect(svgSubjectEffect.get(circle, 'r')).toBe(value);
		const interrupted = api.animate(circle, { r: 80 }, { duration: 1 });
		await frames(2);
		await api.animate(circle, { r: 14 }, { duration: 0.03 });
		expect(getComputedStyle(circle).r).toBe('14px');
		expect(value.get()).toBe(14);
		interrupted.stop();
		await api.animate([circle, ellipse], { cy: 26 }, { duration: 0.03 });
		expect(getComputedStyle(circle).cy).toBe('26px');
		expect(getComputedStyle(ellipse).cy).toBe('26px');
		await api.animate(ellipse, { rx: 8, ry: 9 }, { duration: 0.03 });
		expect(getComputedStyle(ellipse).rx).toBe('8px');
		expect(getComputedStyle(ellipse).ry).toBe('9px');
		const object = { r: 0 };
		await api.animate(object, { r: 7 }, { duration: 0.03 });
		expect(object.r).toBe(7);
	} finally {
		await screen.unmount();
	}
});

it('mini animates numeric and unit-based SVG geometry through native CSS keyframes', async () => {
	const screen = render(Harness);
	await tick();
	const api = screen.component.getApi();
	const circle = api.miniScope.current!.querySelector('circle')!;
	try {
		await api.animateMini('circle', { r: [10, 20, 12], cx: 25, cy: 26 }, { duration: 0.06 });
		expect(getComputedStyle(circle).r).toBe('12px');
		expect(getComputedStyle(circle).cx).toBe('25px');
		expect(getComputedStyle(circle).cy).toBe('26px');
		await api.animateMini(circle, { r: '18px' }, { duration: 0.03 });
		expect(circle.style.r).toBe('18px');
	} finally {
		await screen.unmount();
	}
});
