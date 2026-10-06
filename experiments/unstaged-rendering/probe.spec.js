import { commands } from 'vitest/browser';
import {
	mount,
	unmount,
	flushSync,
	Fixture,
	install,
	stats,
	inCapture,
	Batch,
	compilerCallback,
	beforeCommit,
	queueLayoutMutation
} from './.generated/probe.js';
import { expect, it } from 'vitest';
import '../staged-rendering/style.css';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rect = (node) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height };
};
const distance = (a, b) => Math.max(...Object.keys(a).map((key) => Math.abs(a[key] - b[key])));
async function fixture(staged = false) {
	const host = document.createElement('div');
	document.body.append(host);
	const app = mount(Fixture, { target: host, props: { staged } });
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
for (const mode of ['control', 'batch', 'compiler']) {
	for (const scenario of ['ordinary', 'nested', 'interrupted', 'unowned-staged']) {
		it(`${mode}: ${scenario} first-pop geometry`, async () => {
			const f = await fixture(scenario === 'unowned-staged');
			const restore = install(mode);
			const find = (id) => f.host.querySelector(`[data-cell="${id}"]`);
			let observer;
			try {
				if (scenario === 'interrupted') {
					f.app.reverse();
					await sleep(90);
				}
				const before = new Map([0, 5].map((id) => [id, rect(find(id))]));
				const samples = [];
				observer = new MutationObserver(() => {
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
				await sleep(850);
				const actual = [...f.host.querySelectorAll('[data-cell]')].map((n) => +n.dataset.cell);
				const wanted = Array.from({ length: 30 }, (_, id) => id).filter(
					(id) => id !== 0 && id !== 5
				);
				if (scenario !== 'interrupted') wanted.reverse();
				const maxErrorPx = Math.max(...samples.map((s) => s.errorPx));
				const report = {
					mode,
					scenario,
					maxErrorPx,
					samples,
					stats: { ...stats },
					order: JSON.stringify(actual) === JSON.stringify(wanted)
				};
				await commands.recordResult(report);
				expect(samples).toHaveLength(2);
				expect(actual).toEqual(wanted);
				if (mode === 'control' || (mode === 'batch' && scenario === 'unowned-staged')) {
					expect(maxErrorPx).toBeGreaterThan(50);
					if (scenario === 'unowned-staged') expect(maxErrorPx).toBeCloseTo(302, 1);
				} else expect(maxErrorPx).toBeLessThanOrEqual(0.75);
				if (mode === 'batch') expect(stats.batchCalls).toBeGreaterThan(0);
			} finally {
				observer?.disconnect();
				restore();
				await f.dispose();
			}
		});
	}
	it(`${mode}: async insertion and native outro escape trace`, async () => {
		const f = await fixture();
		const restore = install(mode);
		const mutations = [];
		const originals = [];
		for (const proto of [Element.prototype, CharacterData.prototype]) {
			for (const name of ['before', 'remove']) {
				const original = proto[name];
				originals.push(() => {
					proto[name] = original;
				});
				proto[name] = function (...args) {
					const parent = this.parentElement;
					const area = parent?.closest('[data-async-container],[data-native-container]');
					if (area)
						mutations.push({
							area: area.hasAttribute('data-async-container') ? 'await' : 'native',
							method: name,
							captured: inCapture()
						});
					return original.apply(this, args);
				};
			}
		}
		try {
			f.app.resolveAwait();
			await sleep(80);
			f.app.hideNative();
			await sleep(250);
			const report = { mode, scenario: 'escapes', mutations, stats: { ...stats } };
			await commands.recordResult(report);
			expect(f.host.querySelector('[data-await-ready]')).not.toBeNull();
			expect(f.host.querySelector('[data-native]')).toBeNull();
			expect(mutations).toContainEqual({ area: 'native', method: 'remove', captured: false });
			expect(mutations).toContainEqual({
				area: 'await',
				method: 'before',
				captured: mode === 'compiler'
			});
		} finally {
			originals.forEach((fn) => fn());
			restore();
			await f.dispose();
		}
	});
	it(`${mode}: unrelated text update measurement cost`, async () => {
		const f = await fixture();
		const restore = install(mode);
		let reads = 0;
		const original = Element.prototype.getBoundingClientRect;
		Element.prototype.getBoundingClientRect = function () {
			reads++;
			return original.call(this);
		};
		try {
			flushSync(() => f.app.unrelated());
			await Promise.resolve();
			await commands.recordResult({ mode, scenario: 'unrelated', reads, stats: { ...stats } });
			expect(f.host.querySelector('[data-unrelated]').textContent).toBe('1');
			if (mode === 'control') expect(reads).toBe(0);
			else expect(reads).toBeGreaterThanOrEqual(30);
		} finally {
			Element.prototype.getBoundingClientRect = original;
			restore();
			await f.dispose();
		}
	});
}
it('rejects unknown versions and duplicate installation, restores original method', () => {
	expect(() => install('batch', '5.58.0')).toThrow('Unqualified');
	const original = Batch.prototype.flush;
	const restore = install('batch');
	expect(Batch.prototype.flush).not.toBe(original);
	expect(() => install('batch')).toThrow('already');
	restore();
	expect(Batch.prototype.flush).toBe(original);
	const again = install('batch');
	again();
	expect(inCapture()).toBe(false);
});

for (const mode of ['batch', 'compiler']) {
	it(`${mode}: capture callback can reenter flushSync without recursive capture`, async () => {
		const f = await fixture();
		const restore = install(mode);
		let calls = 0;
		const callback = () => {
			calls++;
			beforeCommit.delete(callback);
			flushSync(() => f.app.unrelated());
		};
		beforeCommit.add(callback);
		try {
			f.app.request();
			await sleep(850);
			expect(calls).toBe(1);
			expect(f.host.querySelectorAll('[data-cell]')).toHaveLength(28);
			expect(f.host.querySelector('[data-unrelated]').textContent).toBe('1');
			expect(inCapture()).toBe(false);
		} finally {
			beforeCommit.delete(callback);
			restore();
			await f.dispose();
		}
	});
}
it('compiler callback exceptions release the transaction and allow subsequent updates', async () => {
	const f = await fixture();
	const restore = install('compiler');
	try {
		const callback = compilerCallback(() => {
			throw new Error('sentinel');
		});
		expect(callback).toThrow('sentinel');
		await Promise.resolve();
		expect(inCapture()).toBe(false);
		f.app.unrelated();
		await sleep(20);
		expect(f.host.querySelector('[data-unrelated]').textContent).toBe('1');
	} finally {
		restore();
		await f.dispose();
	}
});

it('a stale compiler microtask cannot close a newly installed capture', async () => {
	const f = await fixture();
	let restore = install('compiler');
	try {
		compilerCallback(() => {})();
		restore();
		let activeBetweenClosers = false;
		queueMicrotask(() => {
			activeBetweenClosers = inCapture();
		});
		restore = install('compiler');
		compilerCallback(() => {})();
		await Promise.resolve();
		expect(activeBetweenClosers).toBe(true);
		expect(inCapture()).toBe(false);
	} finally {
		restore();
		await f.dispose();
	}
});
it('failed cleanup still permits a fresh installation', async () => {
	const f = await fixture();
	const restore = install('compiler');
	try {
		compilerCallback(() =>
			queueLayoutMutation(() => {
				throw new Error('cleanup');
			}, true)
		)();
		expect(restore).toThrow('cleanup');
		const next = install('control');
		expect(() => install('control')).toThrow('already');
		next();
		expect(inCapture()).toBe(false);
	} finally {
		restore();
		await f.dispose();
	}
});
