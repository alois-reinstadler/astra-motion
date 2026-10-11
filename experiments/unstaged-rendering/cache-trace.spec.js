import { commands } from 'vitest/browser';
import { expect, it } from 'vitest';
import {
	mount,
	unmount,
	flushSync,
	WriteFixture,
	installWriteProbe,
	inCapture
} from './.generated/probe.js';
import '../staged-rendering/style.css';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const box = (node) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height };
};

for (const freeze of [false, true]) {
	it(`presence cache diagnostic: eager-tick mixed publication, freeze=${freeze}`, async () => {
		const host = document.createElement('div');
		document.body.append(host);
		const app = mount(WriteFixture, { target: host, props: { staged: true } });
		flushSync();
		await sleep(500);
		const restore = installWriteProbe('eager-tick', host, app.read);
		const original = WeakMap.prototype.set;
		const snapshots = new WeakMap();
		const writes = [];
		const exits = [];
		const find = (id) => host.querySelector(`[data-cell="${id}"]`);
		const before = new Map([0, 5].map((id) => [id, box(find(id))]));
		const survivorBefore = box(find(1));
		let observer;
		// ponytail: shape-filtered global interception isolates a cache hypothesis only.
		// A real fix needs explicit snapshot provenance/ownership in presence-measure.ts.
		WeakMap.prototype.set = function (key, value) {
			if (
				key instanceof HTMLElement &&
				host.contains(key) &&
				key.hasAttribute('data-cell') &&
				value &&
				typeof value.width === 'string' &&
				typeof value.left === 'number' &&
				typeof value.bottom === 'number' &&
				'parent' in value
			) {
				const active = inCapture();
				const previous = snapshots.get(key);
				const blocked = freeze && active && previous !== undefined;
				if (key.dataset.cell === '0' || key.dataset.cell === '5') {
					writes.push({
						id: +key.dataset.cell,
						active,
						blocked,
						left: value.left,
						width: value.width
					});
				}
				if (blocked) return this;
				if (active) original.call(snapshots, key, value);
				else snapshots.delete(key);
			}
			return original.call(this, key, value);
		};
		try {
			observer = new MutationObserver(() => {
				for (const [id, old] of before) {
					const node = find(id);
					if (
						node &&
						getComputedStyle(node).position === 'absolute' &&
						!exits.some((row) => row.id === id)
					) {
						const current = box(node);
						exits.push({
							id,
							errorPx: Math.max(...Object.keys(old).map((key) => Math.abs(old[key] - current[key])))
						});
					}
				}
			});
			observer.observe(host, { subtree: true, childList: true, attributes: true });
			app.request();
			await sleep(90);
			const survivorMidpoint = box(find(1));
			await sleep(760);
			const survivorFinal = box(find(1));
			await commands.recordResult({
				mode: 'eager-tick',
				scenario: 'presence-cache-trace',
				freeze,
				writes,
				exits,
				survivorBefore,
				survivorMidpoint,
				survivorFinal
			});
			expect(exits).toHaveLength(2);
			for (const id of [0, 5]) {
				const own = writes.filter((row) => row.id === id && row.active);
				expect(parseFloat(own[0].width)).toBeLessThan(60);
				expect(own[0].blocked).toBe(false);
				expect(
					own.slice(1).some((row) => parseFloat(row.width) > 100 && row.blocked === freeze)
				).toBe(true);
			}
			const maximum = Math.max(...exits.map((row) => row.errorPx));
			if (freeze) {
				expect(writes.some((row) => row.blocked)).toBe(true);
				expect(maximum).toBeLessThanOrEqual(0.75);
				const axis =
					Math.abs(survivorFinal.x - survivorBefore.x) >
					Math.abs(survivorFinal.y - survivorBefore.y)
						? 'x'
						: 'y';
				expect(survivorMidpoint[axis]).toBeGreaterThan(
					Math.min(survivorBefore[axis], survivorFinal[axis]) + 1
				);
				expect(survivorMidpoint[axis]).toBeLessThan(
					Math.max(survivorBefore[axis], survivorFinal[axis]) - 1
				);
			} else expect(maximum).toBeCloseTo(302, 1);
			expect([...host.querySelectorAll('[data-cell]')].map((node) => +node.dataset.cell)).toEqual(
				Array.from({ length: 30 }, (_, id) => id)
					.toReversed()
					.filter((id) => id !== 0 && id !== 5)
			);
		} finally {
			WeakMap.prototype.set = original;
			observer?.disconnect();
			restore();
			await unmount(app);
			host.remove();
		}
	});
}
