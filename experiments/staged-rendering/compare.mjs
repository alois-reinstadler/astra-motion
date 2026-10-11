import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { percentile } from './model.mjs';
const key = (r) =>
	JSON.stringify([r.options.mode, r.options.workload, r.options.count, r.options.diagnostic]);
const signature = (r) =>
	JSON.stringify({
		harness: r.provenance.harnessSourceSha256,
		versions: r.provenance.versions,
		environment: { ...r.environment, idleRafCadence: undefined },
		options: { ...r.options, mode: undefined }
	});
const metrics = ['maxRafGapMs', 'p95RafGapMs', 'mutationMs', 'exitCompleteMs'];
function validate(results) {
	if (!Array.isArray(results) || !results.length)
		throw new Error('Expected nonempty exported results array');
	const seen = new Set();
	for (const result of results) {
		if (!result.options.diagnostic && result.validTiming !== true)
			throw new Error('Cannot compare invalid timing cadence');
		if (!result.passed || !result.rows?.length || !result.rows.every((r) => r.passed))
			throw new Error('Cannot compare failing runs');
		if (seen.has(key(result)))
			throw new Error('Duplicate cases: export one result per mode/workload/diagnostic');
		seen.add(key(result));
		if (!result.provenance.harnessSourceSha256 || !result.provenance.astraSourceSha256)
			throw new Error('Missing source hashes');
	}
}
const median = (result, metric) =>
	percentile(result.rows.map((r) => r[metric]).filter(Number.isFinite), 0.5);
export function compare(before, after, repeat) {
	validate(before);
	validate(after);
	if (repeat) validate(repeat);
	const rows = [];
	for (const old of before) {
		const next = after.find((r) => key(r) === key(old));
		if (!next) throw new Error(`Missing after case ${key(old)}`);
		if (signature(old) !== signature(next))
			throw new Error(`Incompatible harness/environment/versions/options for ${key(old)}`);
		const repeated = repeat?.find((r) => key(r) === key(old));
		if (
			repeat &&
			(!repeated ||
				signature(old) !== signature(repeated) ||
				old.provenance.astraSourceSha256 !== repeated.provenance.astraSourceSha256)
		)
			throw new Error('Noise repeat must match before source and settings');
		const reactor = (rs) =>
			rs.find(
				(r) =>
					r.options.mode === 'react' &&
					r.options.workload === old.options.workload &&
					r.options.count === old.options.count &&
					r.options.diagnostic === old.options.diagnostic
			);
		const rb = reactor(before),
			ra = reactor(after);
		if (
			old.options.mode !== 'react' &&
			(!rb || !ra || signature(old) !== signature(rb) || signature(next) !== signature(ra))
		)
			throw new Error('Each Astra case needs matching React control');
		if (old.options.diagnostic) {
			rows.push({
				mode: old.options.mode,
				workload: old.options.workload,
				diagnostic: true,
				beforeReads: old.rows.map((r) => r.reads?.counts),
				afterReads: next.rows.map((r) => r.reads?.counts)
			});
			continue;
		}
		for (const metric of metrics) {
			const a = median(old, metric),
				b = median(next, metric);
			if (a === null || b === null) continue;
			const noise = repeated ? Math.abs(median(repeated, metric) - a) : null;
			const reactBefore = rb ? median(rb, metric) : null,
				reactAfter = ra ? median(ra, metric) : null;
			rows.push({
				mode: old.options.mode,
				workload: old.options.workload,
				metric,
				beforeMedian: a,
				afterMedian: b,
				delta: b - a,
				repeatMedianDelta: noise,
				changeExceedsRepeatDelta: noise === null ? null : Math.abs(b - a) > noise,
				ratioToReactBefore: reactBefore ? a / reactBefore : null,
				ratioToReactAfter: reactAfter ? b / reactAfter : null
			});
		}
	}
	if (before.length !== after.length) throw new Error('Case sets differ');
	return {
		note: 'Descriptive medians, not statistical significance. Closing the gap requires reduced Astra/React ratios, correctness passing, and changes larger than same-source rerun noise. mutationMs excludes deferred work and is not end-to-end latency.',
		rows
	};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [before, after, repeat] = process.argv.slice(2);
	if (!before || !after)
		throw new Error('Usage: node compare.mjs before.json after.json [before-repeat.json]');
	console.log(
		JSON.stringify(
			compare(
				JSON.parse(readFileSync(before)),
				JSON.parse(readFileSync(after)),
				repeat ? JSON.parse(readFileSync(repeat)) : undefined
			),
			null,
			2
		)
	);
}
