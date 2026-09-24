import { animateTarget, AsyncMotionValueAnimation, HTMLVisualElement } from 'motion-dom';
import { animate, scroll } from 'motion';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function fixture(initial: Record<string, number | string>, css: string) {
	const node = document.createElement('div');
	node.style.cssText = css;
	node.textContent = 'An intrinsic-height measurement subject.';
	document.body.append(node);
	const visual = new HTMLVisualElement({
		props: {},
		presenceContext: null,
		visualState: {
			latestValues: initial,
			renderState: { style: {}, vars: {}, transform: {}, transformOrigin: {} }
		}
	});
	visual.mount(node);
	return {
		node,
		visual,
		cleanup() {
			visual.values.forEach((value) => value.stop());
			visual.unmount();
			node.remove();
		}
	};
}

/** Desired result: a canceled playback cannot overwrite a subsequent inline style. */
export async function nativeFinishCancel() {
	const { node, visual, cleanup } = fixture({ opacity: 1 }, 'opacity:1');
	try {
		animateTarget(visual, { opacity: 0.25, transition: { duration: 1 } });
		for (let i = 0; !node.getAnimations().length && i < 60; i++) await frame();
		const native = node.getAnimations()[0];
		if (!native)
			throw new Error('This browser did not create the expected native opacity animation.');
		native.finish();
		const playback = visual.getValue('opacity')!.animation;
		if (!(playback instanceof AsyncMotionValueAnimation))
			throw new Error('Expected asynchronous MotionValue playback.');
		playback.stop();
		playback.cancel();
		node.style.opacity = '0.75';
		await frame();
		await frame();
		return {
			desired: 0.75,
			actual: Number(getComputedStyle(node).opacity),
			remainingAnimations: node.getAnimations().length
		};
	} finally {
		cleanup();
	}
}

/** Reading the public animation getter synchronously resolves an unrelated subject. */
export function pendingGetterMeasurements() {
	const subject = fixture({ opacity: 1 }, 'opacity:1');
	const unrelated = fixture({ height: 30 }, 'width:100px;height:30px');
	const original = window.getComputedStyle;
	let reads = 0;
	window.getComputedStyle = (node, pseudo) => {
		if (node === unrelated.node) reads++;
		return original.call(window, node, pseudo);
	};
	try {
		animateTarget(unrelated.visual, { height: 'auto', transition: { duration: 1 } });
		animateTarget(subject.visual, { opacity: 0.5, transition: { duration: 1 } });
		const playback = subject.visual.getValue('opacity')!.animation;
		if (!(playback instanceof AsyncMotionValueAnimation))
			throw new Error('Expected asynchronous MotionValue playback.');
		const before = reads;
		void playback.animation;
		return { beforeGetter: before, afterGetter: reads };
	} finally {
		window.getComputedStyle = original;
		subject.cleanup();
		unrelated.cleanup();
	}
}

/** Listener accounting, not a GC/heap-retention claim. Uses a custom offset to require fallback. */
export async function scrollCleanupComparison() {
	async function run(withInfo: boolean) {
		const retained: Set<EventListenerOrEventListenerObject>[] = [];
		let observed = 0;
		for (let i = 0; i < 3; i++) {
			const container = document.createElement('div');
			container.style.cssText = 'height:100px;width:200px;overflow:auto;position:relative';
			const target = document.createElement('div');
			target.style.height = '800px';
			container.append(target);
			document.body.append(container);
			const listeners = new Set<EventListenerOrEventListenerObject>();
			retained.push(listeners);
			const add = container.addEventListener.bind(container);
			const remove = container.removeEventListener.bind(container);
			container.addEventListener = (
				type: string,
				callback: EventListenerOrEventListenerObject,
				options?: boolean | AddEventListenerOptions
			) => {
				if (type === 'scroll') listeners.add(callback);
				add(type, callback, options);
			};
			container.removeEventListener = (
				type: string,
				callback: EventListenerOrEventListenerObject,
				options?: boolean | EventListenerOptions
			) => {
				if (type === 'scroll') listeners.delete(callback);
				remove(type, callback, options);
			};
			const options: NonNullable<Parameters<typeof scroll>[1]> = {
				container,
				target,
				offset: ['0.2 0.8', '0.8 0.2']
			};
			const playback = withInfo
				? undefined
				: animate(target, { opacity: [0, 1] }, { autoplay: false });
			const stop = withInfo
				? scroll((value, info) => {
						observed = value + info.y.progress;
					}, options)
				: scroll(playback!, options);
			await frame();
			stop();
			playback?.stop();
			container.remove();
			await frame();
		}
		return {
			remainingScrollListeners: retained.reduce((count, listeners) => count + listeners.size, 0),
			observed
		};
	}
	return {
		timelinePlayback: await run(false),
		informationCallback: await run(true),
		cyclesPerCase: 3
	};
}

export const upstream = { nativeFinishCancel, pendingGetterMeasurements, scrollCleanupComparison };
declare global {
	interface Window {
		upstream: typeof upstream;
	}
}
window.upstream = upstream;

for (const [id, run] of [
	['cancel', nativeFinishCancel],
	['getter', pendingGetterMeasurements],
	['scroll', scrollCleanupComparison]
] as const) {
	document.getElementById(id)!.addEventListener('click', async () => {
		const result = document.getElementById('result')!;
		try {
			result.textContent = JSON.stringify(await run(), null, 2);
		} catch (error) {
			result.textContent = String(error);
		}
	});
}
