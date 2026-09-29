/**
 * Print a self-contained browser signature microbenchmark:
 *   node scripts/benchmark-observer-signature.mjs > /tmp/observer-benchmark.js
 * Execute that function with Chrome DevTools MCP evaluate_script in an owned
 * about:blank tab. It does not launch a browser or exercise animation/rendering.
 * The candidate is extracted from observe.ts; the baseline is the pre-polish
 * Array.from/filter/sort/map/join implementation.
 */
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/lib/motion/observe.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const start = compiled.indexOf('const owned =');
const end = compiled.indexOf('function removePath(');
if (start < 0 || end < start || !compiled.slice(start, end).includes('function signature(')) {
	throw new Error('Observer signature structure changed; update the benchmark extractor.');
}
const candidate = compiled.slice(start, end);

function benchmark() {
	function baseline(style) {
		return Array.from(style)
			.filter((key) => !owned.has(key))
			.sort()
			.map((key) => `${key}:${style.getPropertyValue(key)}!${style.getPropertyPriority(key)}`)
			.join(';');
	}
	const workloads = {
		ownedOnly:
			'transform:translateX(4px);opacity:0.5;color:red;visibility:visible;pointer-events:auto;border-radius:4px',
		mixed:
			'width:100px;height:24px;display:block;--gap:2px !important;transform:translateX(4px);opacity:0.5;color:red',
		customHeavy:
			'width:100px;height:24px;padding:2px;margin:3px;--a:"a;b:c!";--b:calc(2 * 3px);--c:4px !important;--d:5px;--e:6px;transform:translateX(4px);opacity:0.5'
	};
	const participants = 500,
		iterations = 100,
		warmupRounds = 20,
		samples = 12;
	let checksum = 0;
	const measurements = {};
	for (const [name, cssText] of Object.entries(workloads)) {
		const styles = Array.from({ length: participants }, (_, index) => {
			const style = document.createElement('div').style;
			style.cssText = cssText;
			style.transform = `translateX(${index}px)`;
			return style;
		});
		for (const style of styles)
			if (baseline(style) !== signature(style)) throw Error('Signature mismatch');
		function run(fn, count) {
			const start = performance.now();
			for (let round = 0; round < count; round++)
				for (const style of styles) checksum += fn(style).length;
			return performance.now() - start;
		}
		for (let round = 0; round < warmupRounds; round++) {
			if (round % 2) {
				run(signature, 1);
				run(baseline, 1);
			} else {
				run(baseline, 1);
				run(signature, 1);
			}
		}
		const before = [],
			after = [];
		for (let sample = 0; sample < samples; sample++) {
			if (sample % 2) {
				after.push(run(signature, iterations));
				before.push(run(baseline, iterations));
			} else {
				before.push(run(baseline, iterations));
				after.push(run(signature, iterations));
			}
		}
		const median = (values) => {
			const sorted = [...values].sort((a, b) => a - b);
			return (sorted[5] + sorted[6]) / 2;
		};
		measurements[name] = {
			beforeMs: before,
			afterMs: after,
			beforeMedianMs: median(before),
			afterMedianMs: median(after),
			reductionPercent: 100 * (1 - median(after) / median(before))
		};
	}
	return {
		userAgent: navigator.userAgent,
		participants,
		iterations,
		warmupRounds,
		samples,
		signaturesPerSample: participants * iterations,
		checksum,
		measurements
	};
}
const benchmarkBody = benchmark.toString();
process.stdout.write(
	benchmarkBody.slice(0, benchmarkBody.indexOf('{') + 1) +
		'\n' +
		candidate +
		'\n' +
		benchmarkBody.slice(benchmarkBody.indexOf('{') + 1) +
		'\n'
);
