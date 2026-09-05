import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { visualElementStore } from 'motion-dom';
import Lab from '../../routes/motion-lab/+page.svelte';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function element(id: string): HTMLElement {
	const node = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
	if (!node) throw new Error(`Missing ${id}`);
	return node;
}
async function click(id: string) {
	element(id).click();
	await tick();
	await frame();
}

function debugProjection(node: HTMLElement) {
	const visual = visualElementStore.get(node);
	const projection = visual?.projection;
	return JSON.stringify({
		style: node.style.transform,
		reduce: visual?.shouldReduceMotion,
		active: !!projection?.currentAnimation,
		pending: !!projection?.pendingAnimation,
		root: projection?.root && {
			resize: projection.root.updateBlockedByResize,
			updating: projection.root.isUpdating,
			id: projection.root.animationId
		},
		snapshot: projection?.snapshot,
		layout: projection?.layout
	});
}

// Geometry assertions intentionally inspect intermediate states, not only final screenshots.
describe('registered Motion projection and native Svelte presence', () => {
	it('retains the outgoing DOM and reverses the same node', async () => {
		await render(Lab);
		const original = element('presence');
		await click('toggle-presence');
		expect(element('presence')).toBe(original);
		await wait(60);
		await click('toggle-presence');
		await wait(560);
		expect(element('presence')).toBe(original);
		expect(Number(getComputedStyle(original).opacity)).toBeCloseTo(1);
	});

	it('waits for outro and renders only the latest requested value', async () => {
		await render(Lab);
		await click('next-wait');
		await click('next-wait');
		await click('next-wait');
		expect(document.querySelectorAll('[data-testid="wait-item"]')).toHaveLength(1);
		await wait(600);
		expect(element('wait-item').textContent).toContain('04');
	});

	it('projects CSS flex movement from the previous box and retargets in flight', async () => {
		await render(Lab);
		const node = element('orb');
		const first = node.getBoundingClientRect().x;
		element('align').click();
		await tick();
		const start = node.getBoundingClientRect().x;
		expect(Math.abs(start - first), debugProjection(node)).toBeLessThan(25);
		const animation = visualElementStore.get(node)?.projection?.currentAnimation;
		expect(animation).toBeDefined();
		// Seek a paused in-flight frame: headless WebKit may defer the first RAF.
		animation!.pause();
		animation!.time = 0.1;
		await frame();
		const middle = node.getBoundingClientRect().x;
		expect(middle).toBeGreaterThan(first + 5);
		element('align').click();
		await tick();
		const reversed = node.getBoundingClientRect().x;
		expect(Math.abs(reversed - middle)).toBeLessThan(55);
		await wait(850);
		expect(node.getBoundingClientRect().x).toBeCloseTo(first, 0);
	});

	it('pops list exits out of flow before the outro ends and reflows siblings', async () => {
		await render(Lab);
		const exiting = element('tile-0');
		const next = element('tile-1');
		const left = exiting.offsetLeft;
		await click('remove-0');
		await expect.poll(() => getComputedStyle(exiting).position, { timeout: 1000 }).toBe('absolute');
		expect(next.offsetLeft).toBe(left);
		expect(document.querySelectorAll('.tile')).toHaveLength(10);
		await wait(450);
		expect(document.querySelector('[data-testid="tile-0"]')).toBeNull();
		expect(document.querySelectorAll('.tile')).toHaveLength(9);
	});

	it('shares identities across DOM nodes and keeps independent scopes separate', async () => {
		await render(Lab);
		const old = [...document.querySelectorAll<HTMLElement>('.underline')].map(
			(node) => node.getBoundingClientRect().x
		);
		element('tab-0-2').click();
		await tick();
		const nodes = [...document.querySelectorAll<HTMLElement>('.underline')];
		expect(nodes).toHaveLength(2);
		for (const [index, node] of nodes.entries())
			expect(
				Math.abs(node.getBoundingClientRect().x - old[index]),
				debugProjection(node)
			).toBeLessThan(30);
		await wait(900);
		for (const [index, node] of nodes.entries())
			expect(node.getBoundingClientRect().x).toBeGreaterThan(old[index] + 80);
	});

	it('projects intrinsic accordion height and settles at the CSS target', async () => {
		await render(Lab);
		const node = element('accordion-box');
		const before = node.getBoundingClientRect().height;
		element('accordion').click();
		await tick();
		const target = node.offsetHeight;
		expect(target).toBeGreaterThan(before + 20);
		expect(Math.abs(node.getBoundingClientRect().height - before)).toBeLessThan(4);
		await wait(950);
		// offsetHeight rounds to integer CSS pixels; painted bounds may be fractional.
		expect(Math.abs(node.getBoundingClientRect().height - target)).toBeLessThanOrEqual(1);
	});

	it('preserves Motion-owned authored transforms through nested projection', async () => {
		await render(Lab);
		await click('nested');
		await wait(900);
		const matrix = new DOMMatrix(getComputedStyle(element('nested-child')).transform);
		expect((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI).toBeCloseTo(-8, 0);
		expect(Math.hypot(matrix.a, matrix.b)).toBeCloseTo(0.9, 1);
	});

	it('survives reorder/remove/column/parent destruction during active projection', async () => {
		await render(Lab);
		for (let index = 0; index < 8; index++) {
			await click('reorder');
			await click('columns');
		}
		await click('remove-3');
		await click('destroy');
		await wait(450);
		await click('destroy');
		await wait(900);
		expect(document.querySelectorAll('.tile')).toHaveLength(9);
		for (const node of document.querySelectorAll<HTMLElement>('.tile')) {
			const bounds = node.getBoundingClientRect();
			expect(Number.isFinite(bounds.x) && bounds.width > 0).toBe(true);
		}
	});
});
