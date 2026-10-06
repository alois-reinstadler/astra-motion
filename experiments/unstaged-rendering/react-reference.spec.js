import { commands } from 'vitest/browser';
import { expect, it } from 'vitest';
import { startReactReference } from './.generated/probe.js';
import '../staged-rendering/style.css';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const box = (node) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height };
};
const error = (a, b) => Math.max(...Object.keys(a).map((key) => Math.abs(a[key] - b[key])));

for (const interrupted of [false, true]) {
	it(`React reference: ${interrupted ? 'interrupted' : 'ordinary'} combined update`, async () => {
		const host = document.createElement('div');
		document.body.append(host);
		const app = startReactReference(host, { count: 30 });
		const find = (id) => host.querySelector(`[data-cell="${id}"]`);
		const initial = Array.from({ length: 30 }, (_, id) => id);
		let observer;
		let frame;
		try {
			await sleep(500);
			if (interrupted) {
				app.request({ columns: 10, items: initial.toReversed() });
				await sleep(90);
				expect(
					initial.some((id) => find(id).style.transform && find(id).style.transform !== 'none')
				).toBe(true);
			}
			const before = new Map([0, 5].map((id) => [id, box(find(id))]));
			const survivorBefore = new Map([1, 10, 29].map((id) => [id, box(find(id))]));
			const exits = [];
			const frames = [];
			observer = new MutationObserver(() => {
				for (const [id, old] of before) {
					const node = find(id);
					if (
						node &&
						getComputedStyle(node).position === 'absolute' &&
						!exits.some((row) => row.id === id)
					)
						exits.push({ id, errorPx: error(old, box(node)) });
				}
			});
			observer.observe(host, { subtree: true, childList: true, attributes: true });
			const started = performance.now();
			const sample = () => {
				frames.push({
					elapsedMs: performance.now() - started,
					cells: [...survivorBefore].map(([id, old]) => {
						const node = find(id);
						const current = box(node);
						return {
							id,
							x: current.x - old.x,
							y: current.y - old.y,
							transform: node.style.transform
						};
					})
				});
				if (frames.at(-1).elapsedMs < 450) frame = requestAnimationFrame(sample);
			};
			const wanted = (interrupted ? initial : initial.toReversed()).filter(
				(id) => id !== 0 && id !== 5
			);
			app.request({ columns: 5, items: wanted });
			frame = requestAnimationFrame(sample);
			await sleep(850);
			await commands.recordResult({
				mode: 'react-reference',
				scenario: interrupted ? 'interrupted' : 'ordinary',
				maxErrorPx: Math.max(...exits.map((row) => row.errorPx)),
				exits,
				frames,
				note: 'Real-time trajectory diagnostic; not a synchronized cross-framework curve assertion.'
			});
			expect(exits).toHaveLength(2);
			expect(Math.max(...exits.map((row) => row.errorPx))).toBeLessThanOrEqual(0.75);
			expect(frames.length).toBeGreaterThan(2);
			const final = frames.at(-1).cells.find((cell) => cell.id === 29);
			const axis = Math.abs(final.x) > Math.abs(final.y) ? 'x' : 'y';
			expect(
				frames.some((row) => {
					const value = row.cells.find((cell) => cell.id === 29)[axis];
					return value > Math.min(0, final[axis]) + 1 && value < Math.max(0, final[axis]) - 1;
				})
			).toBe(true);
			expect(
				frames.some((row) => row.cells.some((cell) => cell.transform && cell.transform !== 'none'))
			).toBe(true);
			expect([...host.querySelectorAll('[data-cell]')].map((node) => +node.dataset.cell)).toEqual(
				wanted
			);
		} finally {
			observer?.disconnect();
			if (frame) cancelAnimationFrame(frame);
			app.destroy();
			host.remove();
		}
	});
}
