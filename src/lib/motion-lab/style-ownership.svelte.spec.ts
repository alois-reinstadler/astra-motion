import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { flushSync } from 'svelte';
import StyleOwnership, { type StyleSurface } from './StyleOwnership.svelte';

const surfaces: StyleSurface[] = ['flat', 'generic', 'legacy', 'native'];
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const x = (node: Element) => new DOMMatrix(getComputedStyle(node).transform).e;

it.each(surfaces)(
	'%s: reacts to ordinary style mutation, replacement and deletion',
	async (surface) => {
		const screen = render(StyleOwnership, { surface });
		const node = screen.getByTestId('styled').element() as HTMLElement;
		await frame();
		expect(node.style.color).toBe('red');
		flushSync(() => screen.component.mutate({ color: 'blue', width: 75, '--tone': 2 }));
		await expect.poll(() => node.style.color).toBe('blue');
		expect(node.style.width).toBe('75px');
		expect(node.style.getPropertyValue('--tone')).toBe('2');
		flushSync(() => screen.component.remove('color', 'width', '--tone'));
		await expect.poll(() => node.getAttribute('style')).toBe('');
		flushSync(() => screen.component.replace({ backgroundColor: 'green', height: 100 }));
		await expect.poll(() => node.style.backgroundColor).toBe('green');
		expect(node.style.height).toBe('100px');
		expect(screen.getByTestId('styled').element()).toBe(node);
	}
);

for (const initial of [undefined, false] as const) {
	it.each(surfaces)(
		`%s: updates and removes unmixed raw style transforms (initial=${initial})`,
		async (surface) => {
			const screen = render(StyleOwnership, {
				surface,
				initial,
				initialStyle: { transform: 'rotate(30deg)' }
			});
			const node = screen.getByTestId('styled').element() as HTMLElement;
			await frame();
			expect(node.style.transform).toBe('rotate(30deg)');
			flushSync(() => screen.component.mutate({ transform: 'rotate(60deg)' }));
			await expect.poll(() => node.style.transform).toBe('rotate(60deg)');
			flushSync(() => screen.component.replace({ transform: 'rotate(90deg)' }));
			await expect.poll(() => node.style.transform).toBe('rotate(90deg)');
			flushSync(() => screen.component.remove('transform'));
			await expect.poll(() => node.style.transform).toBe('');
			expect(getComputedStyle(node).transform).toBe('none');
			expect(screen.getByTestId('styled').element()).toBe(node);
		}
	);
}

it.each(surfaces)(
	'%s: animated raw transforms override and then return to the style',
	async (surface) => {
		const screen = render(StyleOwnership, {
			surface,
			initialStyle: { transform: 'rotate(30deg)' },
			initial: { transform: 'rotate(15deg)' },
			animate: { transform: 'rotate(60deg)' }
		});
		const node = screen.getByTestId('styled').element() as HTMLElement;
		await expect.poll(() => node.style.transform).toBe('rotate(60deg)');
		flushSync(() => screen.component.mutate({ transform: 'rotate(90deg)' }));
		await frame();
		expect(node.style.transform).toBe('rotate(60deg)');
		// Release both target sources: Motion otherwise returns to the initial target.
		await screen.rerender({ initial: undefined, animate: undefined });
		await expect.poll(() => node.style.transform).toBe('rotate(90deg)');
	}
);

it.each(surfaces)(
	'%s: ordinary styles update without interrupting active Motion values',
	async (surface) => {
		const screen = render(StyleOwnership, {
			surface,
			initial: false,
			animate: { x: 0, opacity: 1 },
			transition: { duration: 0.4, ease: 'linear' }
		});
		const node = screen.getByTestId('styled').element() as HTMLElement;
		await frame();
		await screen.rerender({ animate: { x: 120, opacity: 0.3 } });
		await expect.poll(() => x(node)).toBeGreaterThan(20);
		const before = x(node);
		const opacity = Number(getComputedStyle(node).opacity);
		expect(before).toBeLessThan(120);
		flushSync(() => screen.component.mutate({ color: 'blue' }));
		expect(x(node)).toBeCloseTo(before, 1);
		expect(Number(getComputedStyle(node).opacity)).toBeCloseTo(opacity, 2);
		expect(node.style.color).toBe('blue');
		await expect.poll(() => x(node)).toBeCloseTo(120, 2);
		await expect.poll(() => Number(getComputedStyle(node).opacity)).toBeCloseTo(0.3, 2);
	}
);
