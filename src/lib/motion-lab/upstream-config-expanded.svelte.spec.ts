// Motion v13.4.4, commit 33f6e72d17ebd3e23a2bfb53f3d4c36ce7c11343.
// Sources and MIT attribution: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamConfigExpanded.svelte';
const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));

it('config-transition-inheritance: replaces outer settings unless inherited and merges inner overrides through three providers', async () => {
	const screen = render(Fixture);
	await tick();
	await frame();
	const { replacement, inherited, overridden } = screen.component.values();
	expect([replacement.get(), inherited.get(), overridden.get()]).toEqual([0, 0, 0]);
	screen.component.start();
	await expect.poll(() => inherited.get()).toBe(100);
	// Unspecified outer type:false and easing ()=>0 must both disappear in the replacement lane.
	await expect.poll(() => replacement.get(), { interval: 10 }).toBeGreaterThan(0);
	expect(replacement.get()).toBeLessThan(100);
	expect(overridden.get()).toBe(0);
	await expect.poll(() => replacement.get(), { timeout: 1500 }).toBe(100);
	// Deep delay is retained, but duration/type/ease are the inner overrides, not the five-second outer values.
	await expect.poll(() => overridden.get(), { interval: 10 }).toBeGreaterThan(0);
	expect(overridden.get()).toBeLessThan(100);
	await expect.poll(() => overridden.get(), { timeout: 1500 }).toBe(100);
	for (const name of ['replacement', 'inherited', 'overridden']) {
		const element = document.querySelector(`[data-case="${name}"]`)!;
		await expect.poll(() => new DOMMatrix(getComputedStyle(element).transform).m41).toBe(100);
	}
});

it('config-property-transition: component settings reverse the provider instantaneous axis', async () => {
	const screen = render(Fixture, { mode: 'properties' });
	await tick();
	await frame();
	const { providerX, providerY, localX, localY } = screen.component.values();
	expect([providerX.get(), providerY.get(), localX.get(), localY.get()]).toEqual([0, 0, 0, 0]);
	screen.component.start();
	await expect.poll(() => [providerX.get(), localY.get()]).toEqual([100, 100]);
	expect(providerY.get()).toBeLessThan(100);
	expect(localX.get()).toBeLessThan(100);
	await expect.poll(() => providerY.get(), { interval: 10 }).toBeGreaterThan(0);
	await expect.poll(() => localX.get(), { interval: 10 }).toBeGreaterThan(0);
	await expect.poll(() => [providerY.get(), localX.get()]).toEqual([100, 100]);
});
