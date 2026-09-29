import { afterEach, expect, it, vi } from 'vitest';
import { attachBaseGestures } from './base-gestures.js';
import type { GestureOptions } from './gestures.js';

afterEach(() => vi.unstubAllGlobals());

function viewport(options: GestureOptions, onActive = vi.fn()) {
	let callback!: IntersectionObserverCallback;
	const disconnect = vi.fn();
	const observer = { observe: vi.fn(), disconnect } as unknown as IntersectionObserver;
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			constructor(listener: IntersectionObserverCallback) {
				callback = listener;
				return observer;
			}
		}
	);
	const node = Object.assign(new EventTarget(), {
		matches: () => false,
		closest: () => null
	}) as unknown as HTMLElement;
	const dispose = attachBaseGestures(node, () => options, onActive);
	return {
		dispose,
		disconnect,
		onActive,
		emit(...visible: boolean[]) {
			callback(
				visible.map(
					(isIntersecting) =>
						({
							target: node,
							isIntersecting,
							intersectionRatio: isIntersecting ? 1 : 0
						}) as unknown as IntersectionObserverEntry
				),
				observer
			);
		}
	};
}

it('retains once visibility when enter and leave records arrive in one observer batch', () => {
	const onViewportEnter = vi.fn();
	const onViewportLeave = vi.fn();
	const fixture = viewport({ viewport: { once: true }, onViewportEnter, onViewportLeave });
	try {
		fixture.emit(false, true, false, true);
		expect(fixture.onActive.mock.calls).toEqual([['whileInView', true]]);
		expect(onViewportEnter).toHaveBeenCalledOnce();
		expect(onViewportLeave).not.toHaveBeenCalled();
		expect(fixture.disconnect).toHaveBeenCalledOnce();
		fixture.emit(false);
		expect(onViewportLeave).not.toHaveBeenCalled();
	} finally {
		fixture.dispose();
	}
	expect(fixture.onActive.mock.calls).toEqual([
		['whileInView', true],
		['whileInView', false]
	]);
});

it('continues delivering enter and leave records when once is false', () => {
	const onViewportEnter = vi.fn();
	const onViewportLeave = vi.fn();
	const fixture = viewport({ viewport: { once: false }, onViewportEnter, onViewportLeave });
	try {
		fixture.emit(true, false, true);
		expect(fixture.onActive.mock.calls).toEqual([
			['whileInView', true],
			['whileInView', false],
			['whileInView', true]
		]);
		expect(onViewportEnter).toHaveBeenCalledTimes(2);
		expect(onViewportLeave).toHaveBeenCalledOnce();
		expect(fixture.disconnect).not.toHaveBeenCalled();
	} finally {
		fixture.dispose();
	}
});

it('does not deliver a viewport callback after activation disposes the session', () => {
	const onViewportEnter = vi.fn();
	const onViewportLeave = vi.fn();
	const onActive = vi.fn((_name: string, active: boolean) => {
		if (active) fixture.dispose();
	});
	const fixture = viewport({ onViewportEnter, onViewportLeave }, onActive);
	try {
		fixture.emit(true, false, true);
		expect(onViewportEnter).not.toHaveBeenCalled();
		expect(onViewportLeave).not.toHaveBeenCalled();
		expect(onActive.mock.calls).toEqual([
			['whileInView', true],
			['whileInView', false]
		]);
		expect(fixture.disconnect).toHaveBeenCalledOnce();
	} finally {
		fixture.dispose();
	}
});

it('stops delivering the batch when a viewport callback disposes the session', () => {
	const onViewportEnter = vi.fn(() => fixture.dispose());
	const onViewportLeave = vi.fn();
	const fixture = viewport({ onViewportEnter, onViewportLeave });
	try {
		fixture.emit(true, false, true);
		fixture.emit(true);
		expect(onViewportEnter).toHaveBeenCalledOnce();
		expect(onViewportLeave).not.toHaveBeenCalled();
		expect(fixture.disconnect).toHaveBeenCalledOnce();
	} finally {
		fixture.dispose();
	}
});
