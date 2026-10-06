// Dependency-read counts only: this does not measure browser layout or elapsed time.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const version = require('svelte/package.json').version;
assert.equal(version, '5.57.0', 'Requalify private eager effects when Svelte changes');
const client = resolve(dirname(require.resolve('svelte/package.json')), 'src/internal/client');
const internal = (path) => import(pathToFileURL(resolve(client, path)).href);
const { eager_effect, effect_root } = await internal('reactivity/effects.js');
const { proxy } = await internal('proxy.js');
const { flushSync } = await internal('reactivity/batch.js');
const records = [];

for (const count of [30, 500]) {
	for (const operation of ['replace', 'reverse']) {
		const state = proxy({ items: Array.from({ length: count }, (_, id) => id) });
		let callbacks = 0;
		let itemReads = 0;
		const dispose = effect_root(() => {
			eager_effect(() => {
				callbacks++;
				for (const item of state.items) {
					assert.equal(typeof item, 'number');
					itemReads++;
				}
			});
		});
		try {
			callbacks = itemReads = 0;
			if (operation === 'reverse') state.items.reverse();
			else state.items = state.items.toReversed();
			flushSync();
			assert.deepEqual(
				[...state.items],
				Array.from({ length: count }, (_, id) => count - 1 - id)
			);
			assert.equal(callbacks, operation === 'reverse' ? count : 1);
			assert.equal(itemReads, operation === 'reverse' ? count * count : count);
			records.push({ count, operation, callbacks, itemReads });
		} finally {
			dispose();
		}
		const previous = callbacks;
		state.items = [];
		flushSync();
		assert.equal(callbacks, previous, 'Disposed subscriptions must stop observing');
	}
}
console.log(
	JSON.stringify({ version, kind: 'synchronous dependency-read counts', records }, null, 2)
);
