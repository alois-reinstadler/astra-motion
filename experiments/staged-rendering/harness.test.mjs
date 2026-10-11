import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initial, change, workloads } from './model.mjs';
import { validateOptions } from './harness.mjs';
import { compare } from './compare.mjs';
test('workload oracle preserves unique IDs and exercises distributed exits', () => {
	const state = initial();
	assert.deepEqual(change(state, 'reverse').items, [...state.items].reverse());
	assert.equal(change(state, 'resize').columns, 5);
	assert.equal(change(state, 'single-exit').items.length, 499);
	assert.equal(change(state, 'remove100').items.length, 400);
	assert.equal(change(state, 'remove500').items.length, 0);
	for (const workload of workloads) {
		const next = change(state, workload);
		assert.equal(new Set(next.items).size, next.items.length);
	}
	assert.equal(state.items[0], 0);
	assert.equal(state.items.length, 500);
});
test('automation options are bounded and reject silent typos', () => {
	assert.equal(validateOptions().trials, 3);
	for (const options of [
		{ mode: 'native' },
		{ trials: 100 },
		{ warmups: -1 },
		{ count: NaN },
		{ observationMs: 100 }
	])
		assert.throws(() => validateOptions(options));
});
const result = (mode, value, hash = 'a') => ({
	passed: true,
	validTiming: true,
	provenance: {
		harnessSourceSha256: 'fixture',
		astraSourceSha256: hash,
		versions: { react: '18.3.1' }
	},
	environment: { width: 1280 },
	options: { mode, workload: 'reverse', count: 500, diagnostic: false, trials: 3, warmups: 1 },
	rows: [{ passed: true, maxRafGapMs: value, mutationMs: value, exitCompleteMs: null }]
});
test('comparison reports gap ratios and rejects mismatched/failing controls', () => {
	const before = [result('react', 10), result('astra-native', 20)];
	const after = [result('react', 10, 'b'), result('astra-native', 15, 'b')];
	const repeat = [result('react', 11), result('astra-native', 21)];
	const row = compare(before, after, repeat).rows.find(
		(r) => r.mode === 'astra-native' && r.metric === 'maxRafGapMs'
	);
	assert.equal(row.ratioToReactBefore, 2);
	assert.equal(row.ratioToReactAfter, 1.5);
	assert.equal(row.repeatMedianDelta, 1);
	assert.equal(row.changeExceedsRepeatDelta, true);
	const wrong = structuredClone(after);
	wrong[1].environment.width = 900;
	assert.throws(() => compare(before, wrong));
	wrong[1] = result('astra-native', 15);
	wrong[1].passed = false;
	assert.throws(() => compare(before, wrong));
	assert.throws(() => compare(before, [after[1]]));
});
