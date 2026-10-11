import { commands } from 'vitest/browser';
import {
	mount,
	unmount,
	flushSync,
	WriteFixture,
	installWriteProbe,
	writeStats,
	inCapture,
	stats,
	beforeCommit
} from './.generated/probe.js';
import { expect, it } from 'vitest';
import '../staged-rendering/style.css';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rect = (node) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height };
};
const distance = (a, b) => Math.max(...Object.keys(a).map((key) => Math.abs(a[key] - b[key])));
function betweenEndpoints(before, midpoint, final) {
	const axis = Math.abs(final.x - before.x) > Math.abs(final.y - before.y) ? 'x' : 'y';
	const low = Math.min(before[axis], final[axis]);
	const high = Math.max(before[axis], final[axis]);
	return high - low > 10 && midpoint[axis] > low + 1 && midpoint[axis] < high - 1;
}
async function fixture(staged = false) {
	const host = document.createElement('div');
	document.body.append(host);
	const app = mount(WriteFixture, { target: host, props: { staged } });
	flushSync();
	await sleep(500);
	return {
		host,
		app,
		async dispose() {
			await unmount(app);
			host.remove();
		}
	};
}
for (const mode of ['control', 'dom', 'eager', 'eager-tick']) {
	for (const scenario of ['ordinary', 'nested', 'interrupted', 'unowned-staged']) {
		it(`${mode}: ${scenario} first-pop geometry`, async () => {
			const f = await fixture(scenario === 'unowned-staged');
			const restore = installWriteProbe(mode, f.host, f.app.read);
			const find = (id) => f.host.querySelector(`[data-cell="${id}"]`);
			let observer;
			let firstFrame;
			try {
				let reorderAnimated = null;
				const captureOrders = [];
				if (scenario === 'interrupted') {
					const recordOrder = () =>
						captureOrders.push(
							[...f.host.querySelectorAll('[data-cell]')].map((node) => +node.dataset.cell)
						);
					beforeCommit.add(recordOrder);
					try {
						f.app.reverse();
						await sleep(90);
						reorderAnimated = [...f.host.querySelectorAll('[data-cell]')].some(
							(node) => node.style.transform && node.style.transform !== 'none'
						);
					} finally {
						beforeCommit.delete(recordOrder);
					}
				}

				const before = new Map([0, 5].map((id) => [id, rect(find(id))]));
				const samples = [];
				const survivorBefore = new Map([1, 10, 29].map((id) => [id, rect(find(id))]));
				const survivorSamples = [];
				const survivorFrameSamples = [];
				observer = new MutationObserver(() => {
					if (
						find(0) &&
						getComputedStyle(find(0)).position === 'absolute' &&
						!survivorSamples.length
					) {
						firstFrame = requestAnimationFrame(() => {
							for (const [id, before] of survivorBefore) {
								const node = find(id);
								if (!node) continue;
								const after = rect(node);
								survivorFrameSamples.push({
									id,
									positionDeltaPx: Math.max(
										Math.abs(before.x - after.x),
										Math.abs(before.y - after.y)
									),
									transform: node.style.transform
								});
							}
						});
						for (const [id, before] of survivorBefore) {
							const after = rect(find(id));
							survivorSamples.push({
								id,
								positionErrorPx: Math.max(
									Math.abs(before.x - after.x),
									Math.abs(before.y - after.y)
								)
							});
						}
					}
					for (const id of [0, 5]) {
						const node = find(id);
						if (
							node &&
							getComputedStyle(node).position === 'absolute' &&
							!samples.some((s) => s.id === id)
						)
							samples.push({ id, errorPx: distance(before.get(id), rect(node)) });
					}
				});
				observer.observe(f.host, { attributes: true, subtree: true, childList: true });
				f.app.request(scenario === 'nested');
				await sleep(90);
				const survivorMidpoints = new Map([1, 10, 29].map((id) => [id, rect(find(id))]));
				const survivorAnimated = [1, 10, 29]
					.map(find)
					.some((node) => node.style.transform && node.style.transform !== 'none');
				await sleep(760);
				const actual = [...f.host.querySelectorAll('[data-cell]')].map((n) => +n.dataset.cell);
				const wanted = Array.from({ length: 30 }, (_, id) => id).filter(
					(id) => id !== 0 && id !== 5
				);
				if (scenario !== 'interrupted') wanted.reverse();
				const maxErrorPx = Math.max(...samples.map((s) => s.errorPx));
				const survivorTrajectories = [...survivorBefore].map(([id, before]) => ({
					id,
					before,
					midpoint: survivorMidpoints.get(id),
					final: rect(find(id))
				}));
				const report = {
					mode,
					scenario: 'write-' + scenario,
					maxErrorPx,
					reorderAnimated,
					survivorAnimated,
					survivorTrajectories,
					interruptionQualified: scenario === 'interrupted' ? reorderAnimated : null,
					captureOrders,
					survivorSamples,
					survivorFrameSamples,
					samples,
					stats: { ...stats },
					writeStats: structuredClone(writeStats),
					order: JSON.stringify(actual) === JSON.stringify(wanted)
				};
				await commands.recordResult(report);
				expect(samples).toHaveLength(2);
				expect(survivorSamples).toHaveLength(3);
				expect(survivorFrameSamples).toHaveLength(3);
				expect(actual).toEqual(wanted);
				expect(survivorAnimated).toBe(true);
				expect(
					survivorTrajectories.some((row) => betweenEndpoints(row.before, row.midpoint, row.final))
				).toBe(true);
				if (scenario === 'interrupted') expect(reorderAnimated).toBe(true);
				if (mode === 'control' || (mode.startsWith('eager') && scenario === 'unowned-staged')) {
					expect(maxErrorPx).toBeGreaterThan(50);
				} else {
					expect(maxErrorPx).toBeLessThanOrEqual(0.75);
					// Frames advance before rAF sampling; a 40px ceiling detects the prior
					// 477px suppression bug without pretending this is curve equivalence.
					const maxSurvivorDelta = Math.max(
						...survivorFrameSamples.map((row) => row.positionDeltaPx)
					);
					expect(maxSurvivorDelta).toBeLessThanOrEqual(40);
				}
				if (scenario === 'interrupted' && mode !== 'control')
					expect(captureOrders[0]).toEqual(Array.from({ length: 30 }, (_, id) => id));
			} finally {
				observer?.disconnect();
				if (firstFrame) cancelAnimationFrame(firstFrame);
				restore();
				await f.dispose();
			}
		});
	}
}
for (const mode of ['control', 'dom', 'eager', 'eager-tick']) {
	for (const scenario of ['splice', 'await']) {
		it(`${mode}: ${scenario} Motion survivor trajectory`, async () => {
			const f = await fixture();
			const observedState = [];
			const restore = installWriteProbe(mode, f.host, () => {
				const value = f.app.read();
				observedState.push(value);
				return value;
			});
			let observer;
			let firstFrame;
			try {
				const node = f.host.querySelector('[data-cell="1"]');
				const before = rect(node);
				let firstFrameSample;
				observer = new MutationObserver(() => {
					if (firstFrame) return;
					firstFrame = requestAnimationFrame(() => {
						firstFrameSample = { rect: rect(node), transform: node.style.transform };
					});
				});
				observer.observe(f.host, { childList: true, attributes: true, subtree: true });
				if (scenario === 'splice') f.app.splice();
				else f.app.resolveAwait();
				await sleep(90);
				const midpoint = { rect: rect(node), transform: node.style.transform };
				await sleep(700);
				const final = rect(node);
				const finalOrder = [...f.host.querySelectorAll('[data-cell]')].map(
					(node) => +node.dataset.cell
				);
				await commands.recordResult({
					mode,
					scenario: 'write-' + scenario,
					before,
					firstFrameSample,
					midpoint,
					final,
					observedState: {
						calls: observedState.length,
						intermediateDuplicateKeys: observedState.some(
							(values) => new Set(values.slice(1)).size !== values.length - 1
						),
						final: observedState.at(-1)
					},
					stats: { ...stats },
					writeStats: structuredClone(writeStats)
				});
				expect(finalOrder).toEqual(
					Array.from({ length: 30 }, (_, id) => id).filter(
						(id) => scenario !== 'splice' || id !== 0
					)
				);
				expect(firstFrameSample).toBeDefined();
				expect(midpoint.transform).toContain('translate3d');
				expect(betweenEndpoints(before, midpoint.rect, final)).toBe(true);
				if (scenario === 'await') {
					expect(final.y - before.y).toBeCloseTo(70, 1);
					if (mode === 'dom') {
						expect(distance(firstFrameSample.rect, before)).toBeLessThanOrEqual(0.75);
						expect(stats.captures).toBe(1);
					} else expect(stats.captures).toBe(0);
				} else expect(final.x).toBeLessThan(before.x);
			} finally {
				observer?.disconnect();
				if (firstFrame) cancelAnimationFrame(firstFrame);
				restore();
				await f.dispose();
			}
		});
	}
	it(`${mode}: unrelated writes and completed Motion frames do not recapture indefinitely`, async () => {
		const f = await fixture();
		const restore = installWriteProbe(mode, f.host, f.app.read);
		const original = Element.prototype.getBoundingClientRect;
		let reads = 0;
		try {
			Element.prototype.getBoundingClientRect = function () {
				reads++;
				return original.call(this);
			};
			flushSync(() => f.app.unrelated());
			await Promise.resolve();
			const unrelatedReads = reads;
			Element.prototype.getBoundingClientRect = original;
			f.app.request();
			await sleep(850);
			expect(unrelatedReads).toBe(mode === 'dom' ? 30 : 0);
			const capturesAfterAnimation = stats.captures;
			await sleep(150);
			expect(stats.captures).toBe(capturesAfterAnimation);
			await commands.recordResult({
				mode,
				scenario: 'write-unrelated',
				reads: unrelatedReads,
				stats: { ...stats },
				writeStats: structuredClone(writeStats)
			});
		} finally {
			Element.prototype.getBoundingClientRect = original;
			restore();
			await f.dispose();
		}
	});
}
for (const mode of ['dom', 'eager', 'eager-tick']) {
	it(`${mode}: disposal and fresh installation`, async () => {
		const f = await fixture();
		const originalBefore = CharacterData.prototype.before;
		const originalStyle = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cssText');
		let restore = installWriteProbe(mode, f.host, f.app.read);
		try {
			f.app.request();
			await sleep(850);
			expect(f.host.querySelectorAll('[data-cell]')).toHaveLength(28);
			restore();
			restore();
			expect(CharacterData.prototype.before).toBe(originalBefore);
			expect(Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cssText')).toEqual(
				originalStyle
			);
			const captures = stats.captures;
			f.app.reverse();
			await sleep(450);
			expect(stats.captures).toBe(captures);
			restore = installWriteProbe(mode, f.host, f.app.read);
			f.app.reverse();
			await sleep(450);
			expect(stats.captures).toBeGreaterThan(0);
		} finally {
			restore();
			await f.dispose();
		}
	});
}
it('DOM interception retains unsupported mutation paths as explicit negative controls', async () => {
	const f = await fixture();
	const cachedAppend = Node.prototype.appendChild;
	const restore = installWriteProbe('dom', f.host, f.app.read);
	try {
		const grid = f.host.querySelector('.grid');
		const captures = [];
		const probe = (name, update) => {
			const count = stats.captures;
			update();
			captures.push({ name, captured: stats.captures !== count });
		};
		probe('direct style.gridTemplateColumns', () => {
			grid.style.gridTemplateColumns = 'repeat(5,minmax(0,1fr))';
		});
		probe('setAttribute style', () =>
			grid.setAttribute('style', 'grid-template-columns: repeat(6,minmax(0,1fr))')
		);
		probe('className', () => {
			grid.className += ' direct-class';
		});
		probe('classList', () => grid.classList.add('token-class'));
		probe('cached appendChild', () => cachedAppend.call(grid, document.createElement('span')));
		const outside = document.createElement('div');
		document.body.append(outside);
		probe('move to outside receiver', () => outside.appendChild(grid.lastChild));
		outside.remove();
		await commands.recordResult({ mode: 'dom', scenario: 'write-unsupported', captures });
		expect(captures.every((row) => !row.captured)).toBe(true);
	} finally {
		restore();
		await f.dispose();
	}
});
it('DOM mutation exceptions close the pending capture and restore interception', async () => {
	const f = await fixture();
	const original = Node.prototype.removeChild;
	const restore = installWriteProbe('dom', f.host, f.app.read);
	try {
		expect(() => f.host.removeChild(document.createElement('span'))).toThrow();
		await Promise.resolve();
		f.app.request();
		await sleep(850);
		expect(f.host.querySelectorAll('[data-cell]')).toHaveLength(28);
	} finally {
		restore();
		expect(Node.prototype.removeChild).toBe(original);
		await f.dispose();
	}
});
it('a failing eager getter releases its root and permits subsequent installation', async () => {
	const f = await fixture();
	try {
		expect(() =>
			installWriteProbe('eager', f.host, () => {
				throw new Error('getter sentinel');
			})
		).toThrow('getter sentinel');
		const restore = installWriteProbe('eager', f.host, f.app.read);
		try {
			f.app.request();
			await sleep(850);
			expect(f.host.querySelectorAll('[data-cell]')).toHaveLength(28);
		} finally {
			restore();
		}
	} finally {
		await f.dispose();
	}
});
it('a disposed eager tick closer cannot finalize the next installed capture', async () => {
	const f = await fixture();
	let restore = installWriteProbe('eager-tick', f.host, f.app.read);
	try {
		f.app.reverse();
		restore();
		restore = installWriteProbe('eager-tick', f.host, f.app.read);
		f.app.reverse();
		await sleep(450);
		expect(stats.captures).toBe(1);
		expect(inCapture()).toBe(false);
		expect([...f.host.querySelectorAll('[data-cell]')].map((node) => +node.dataset.cell)).toEqual(
			Array.from({ length: 30 }, (_, id) => id)
		);
	} finally {
		restore();
		await f.dispose();
	}
});
for (const mode of ['dom', 'eager', 'eager-tick']) {
	it(`${mode}: reentrant user mutation remains unsupported`, async () => {
		const f = await fixture();
		const restore = installWriteProbe(mode, f.host, f.app.read);
		let calls = 0;
		const reenter = () => {
			calls++;
			beforeCommit.delete(reenter);
			flushSync(() => f.app.unrelated());
		};
		try {
			beforeCommit.add(reenter);
			if (mode === 'dom') f.app.request();
			else expect(() => f.app.request()).toThrow('state_unsafe_mutation');
			await sleep(850);
			const remaining = [...f.host.querySelectorAll('[data-cell]')].map(
				(node) => +node.dataset.cell
			);
			await commands.recordResult({
				mode,
				scenario: 'write-reentry-unsupported',
				calls,
				remaining,
				stats: { ...stats }
			});
			expect(calls).toBe(1);
			if (mode === 'dom') expect(remaining).toHaveLength(29);
		} finally {
			beforeCommit.delete(reenter);
			restore();
			await f.dispose();
		}
	});
}
