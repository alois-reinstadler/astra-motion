// Motion v13.4.4 gestures/__tests__/hover.test.tsx adaptations.
// Source mapping and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UpstreamGestures from './UpstreamGestures.svelte';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function pointer(target: EventTarget, type: string, x = 10) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			pointerId: 1,
			pointerType: 'mouse',
			isPrimary: true,
			button: 0,
			buttons: type === 'pointerup' ? 0 : 1,
			clientX: x,
			clientY: 10
		})
	);
}

it('suppresses new hover during a real drag and restores hover after release', async () => {
	const report = vi.fn();
	const view = render(UpstreamGestures, { report });
	await tick();
	const drag = view.getByTestId('drag').element();
	const hover = view.getByTestId('hover').element();
	try {
		pointer(drag, 'pointerdown');
		pointer(window, 'pointermove', 50);
		await expect.poll(() => report.mock.calls.map(([event]) => event)).toContain('drag:start');
		expect(view.component.readDrag()).toBe(40);
		pointer(hover, 'pointerenter', 50);
		await frame();
		await frame();
		expect(getComputedStyle(hover).opacity).toBe('1');
		expect(report.mock.calls.map(([event]) => event)).not.toContain('hover:start');
		pointer(hover, 'pointerleave', 50);
		pointer(window, 'pointerup', 50);
		await expect.poll(() => report.mock.calls.map(([event]) => event)).toContain('drag:end');
		pointer(hover, 'pointerenter', 50);
		await expect.poll(() => getComputedStyle(hover).opacity).toBe('0.5');
		pointer(hover, 'pointerleave', 50);
		await expect.poll(() => getComputedStyle(hover).opacity).toBe('1');
		expect(report.mock.calls.map(([event]) => event)).toEqual([
			'drag:start',
			'drag:end',
			'hover:start',
			'hover:end'
		]);
	} finally {
		pointer(window, 'pointerup', 50);
		await view.unmount();
	}
});

it('retains hover during drag and ends it after release outside', async () => {
	const report = vi.fn();
	const view = render(UpstreamGestures, { report });
	await tick();
	const drag = view.getByTestId('drag').element();
	const hover = drag;
	try {
		pointer(hover, 'pointerenter');
		await expect.poll(() => getComputedStyle(hover).opacity).toBe('0.5');
		pointer(drag, 'pointerdown');
		pointer(window, 'pointermove', 50);
		await expect.poll(() => report.mock.calls.map(([event]) => event)).toContain('drag:start');
		pointer(hover, 'pointerleave', 50);
		await frame();
		await frame();
		expect(getComputedStyle(hover).opacity).toBe('0.5');
		expect(report.mock.calls.map(([event]) => event)).not.toContain('hover:end');
		pointer(window, 'pointerup', 50);
		await expect.poll(() => getComputedStyle(hover).opacity).toBe('1');
		expect(report.mock.calls.filter(([event]) => event === 'hover:end')).toHaveLength(1);
	} finally {
		pointer(window, 'pointerup', 50);
		await view.unmount();
	}
});
