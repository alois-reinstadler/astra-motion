// Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion.
import { tick } from 'svelte';
import { expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Fixture from './UpstreamControlsExtended.svelte';
const node = (id: string) =>
	document.querySelector<HTMLElement>(`[data-upstream-control="${id}"]`)!;
const x = (id: string) => new DOMMatrix(getComputedStyle(node(id)).transform).m41;
it('controls-initial-set-tree: preserves initial, resolves subscriber custom and sets an unlabelled ancestor tree', async () => {
	const { component } = render(Fixture);
	await tick();
	for (let i = 0; i < 3; i++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
	const { controls, tree, first, second, child, grandchild } = component.api();
	expect([x('first'), x('second')]).toEqual([10, 20]);
	await controls.start((custom: number) => ({ x: custom * 40 }), { duration: 0.05 });
	expect([first.get(), second.get()]).toEqual([40, 80]);
	await expect.poll(() => [x('first'), x('second')]).toEqual([40, 80]);
	expect(x('grandchild')).toBe(0);
	tree.set('active');
	expect([child.get(), grandchild.get()]).toEqual([60, 60]);
	await expect.poll(() => [x('child'), x('grandchild')]).toEqual([60, 60]);
	expect([node('child').style.opacity, node('grandchild').style.opacity]).toEqual(['0.4', '0.4']);
});
