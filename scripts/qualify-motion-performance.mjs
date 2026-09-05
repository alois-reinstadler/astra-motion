import { chromium } from 'playwright';
import { parseArgs } from 'node:util';
import { cpus, totalmem, release, loadavg } from 'node:os';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const { values: args } = parseArgs({
	options: {
		url: { type: 'string', default: 'http://127.0.0.1:5199' },
		output: { type: 'string', default: 'docs/research/production-performance.json' },
		counts: { type: 'string', default: '100,500' },
		rates: { type: 'string', default: '1,4,6' },
		modes: { type: 'string', default: 'automatic,explicit,instant' },
		repeats: { type: 'string', default: '3' },
		steps: { type: 'string', default: '18' },
		gap: { type: 'string', default: '80' },
		settle: { type: 'string', default: '1400' },
		'memory-cycles': { type: 'string', default: '30' },
		traces: { type: 'boolean', default: false },
		'traces-only': { type: 'boolean', default: false },
		'trace-dir': { type: 'string', default: '/tmp/astra-production-traces' },
		'package-tarball': { type: 'string' },
		'no-reads': { type: 'boolean', default: false }
	}
});
const counts = args.counts.split(',').map(Number);
const rates = args.rates.split(',').map(Number);
const modes = args.modes.split(',');
const repeats = Number(args.repeats);
const steps = Number(args.steps);
const gap = Number(args.gap);
const settle = Number(args.settle);
const cycles = Number(args['memory-cycles']);
if (
	!counts.every((n) => [1, 10, 100, 500].includes(n)) ||
	!rates.every((n) => n >= 1) ||
	!modes.every((mode) => ['automatic', 'explicit', 'instant'].includes(mode))
)
	throw new Error('Invalid benchmark matrix');
const output = resolve(args.output);
await mkdir(dirname(output), { recursive: true });
const result = {
	date: new Date().toISOString(),
	status: 'running',
	command: process.argv.slice(2),
	environment: {
		platform: process.platform,
		kernel: release(),
		node: process.version,
		cpu: cpus()[0]?.model,
		logicalCpus: cpus().length,
		memoryBytes: totalmem(),
		loadAtStart: loadavg()
	},
	method: {
		productionRequired: true,
		viewport: { width: 1280, height: 1040 },
		rates,
		counts,
		modes,
		repeats,
		steps,
		requestedGapMs: gap,
		settleWindowMs: settle,
		readInstrumentation: !args['no-reads'],
		warmup: 'two six-operation cycles per fresh browser/configuration',
		cpu: 'CDP relative slowdown, not calibrated hardware or a physical mobile device',
		frames:
			'RAF intervals; missed-refresh estimate is not a measurement of compositor dropped frames',
		memory:
			'separate 1x mount/destroy run; forced GC checkpoints; no strong node arrays retained by fixture',
		traces: 'separate diagnostic runs; not pooled with primary timing samples'
	},
	rows: [],
	memory: [],
	traces: []
};
if (args['package-tarball']) {
	const bytes = await readFile(args['package-tarball']);
	result.package = {
		path: resolve(args['package-tarball']),
		bytes: bytes.length,
		sha256: createHash('sha256').update(bytes).digest('hex')
	};
}
const save = () => writeFile(output, JSON.stringify(result, null, 2) + '\n');
const quantile = (values, p) => {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? null;
};
const metricNames = [
	'LayoutCount',
	'RecalcStyleCount',
	'LayoutDuration',
	'RecalcStyleDuration',
	'ScriptDuration',
	'TaskDuration'
];
const metrics = async (cdp) =>
	Object.fromEntries(
		(await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value])
	);
const difference = (before, after) =>
	Object.fromEntries(metricNames.map((name) => [name, after[name] - before[name]]));
const frame = (page) => page.evaluate(() => new Promise((done) => requestAnimationFrame(done)));

async function open(count, mode, rate, inspectObserver = false) {
	const browser = await chromium.launch({ headless: true });
	const context = await browser.newContext({
		viewport: result.method.viewport,
		reducedMotion: 'no-preference'
	});
	const page = await context.newPage();
	if (inspectObserver)
		await page.addInitScript(() => {
			const Original = window.MutationObserver;
			window.__observerCost = { enabled: false, calls: 0, records: 0, milliseconds: 0 };
			window.MutationObserver = class extends Original {
				constructor(callback) {
					super((records, observer) => {
						const start = performance.now();
						callback(records, observer);
						if (window.__observerCost.enabled) {
							window.__observerCost.calls++;
							window.__observerCost.records += records.length;
							window.__observerCost.milliseconds += performance.now() - start;
						}
					});
				}
			};
		});
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	const response = await page.goto(`${args.url}/performance?count=${count}&mode=${mode}`, {
		waitUntil: 'networkidle'
	});
	if (!response?.ok()) throw new Error(`Performance route failed: ${response?.status()}`);
	await page.waitForFunction(() => window.__motionPerf);
	const identity = await page.evaluate(() => window.__motionPerf.identity);
	if (!identity.production) throw new Error('Refusing to profile a development build');
	const resources = await page.evaluate(() =>
		performance.getEntriesByType('resource').map((entry) => entry.name)
	);
	if (resources.some((url) => url.includes('/@vite/client')))
		throw new Error('Vite development client detected');
	if (!result.browser) {
		const browserCDP = await browser.newBrowserCDPSession();
		result.browser = {
			version: browser.version(),
			userAgent: await page.evaluate(() => navigator.userAgent),
			resources
		};
		try {
			const info = await browserCDP.send('SystemInfo.getInfo');
			result.browser.gpu = info.gpu;
		} catch (error) {
			result.browser.gpuUnavailable = String(error);
		}
		await browserCDP.detach();
	}
	const cdp = await context.newCDPSession(page);
	await cdp.send('Performance.enable');
	await cdp.send('Emulation.setCPUThrottlingRate', { rate });
	await installProbe(page);
	await page.waitForTimeout(400);
	return { browser, page, cdp, errors };
}

async function installProbe(page) {
	await page.evaluate(
		({ countReads }) => {
			let enabled = false,
				raf = 0,
				previous = 0,
				started = 0,
				frameIntervals = [],
				bcr = 0,
				styles = 0,
				entries = [];
			const originalBounds = Element.prototype.getBoundingClientRect;
			const originalStyles = window.getComputedStyle;
			if (countReads) {
				Element.prototype.getBoundingClientRect = function () {
					if (enabled) bcr++;
					return originalBounds.call(this);
				};
				window.getComputedStyle = function (...args) {
					if (enabled) styles++;
					return originalStyles.apply(window, args);
				};
			}
			const accept = (batch) => {
				if (enabled)
					for (const entry of batch)
						if (entry.startTime >= started)
							entries.push({
								type: entry.entryType,
								duration: entry.duration,
								forcedMs: (entry.scripts ?? []).reduce(
									(sum, script) => sum + (script.forcedStyleAndLayoutDuration ?? 0),
									0
								)
							});
			};
			const supported = ['longtask', 'long-animation-frame'].filter((type) =>
				PerformanceObserver.supportedEntryTypes.includes(type)
			);
			const observer = new PerformanceObserver((list) => accept(list.getEntries()));
			if (supported.length) observer.observe({ entryTypes: supported });
			function sample(time) {
				if (previous) frameIntervals.push(time - previous);
				previous = time;
				raf = requestAnimationFrame(sample);
			}
			window.__perfProbe = {
				start() {
					bcr = styles = 0;
					frameIntervals = [];
					entries = [];
					previous = 0;
					started = performance.now();
					enabled = true;
					performance.clearMarks('astra-perf-start');
					performance.mark('astra-perf-start');
					if (window.__observerCost)
						Object.assign(window.__observerCost, {
							enabled: true,
							calls: 0,
							records: 0,
							milliseconds: 0
						});
					raf = requestAnimationFrame(sample);
				},
				stop() {
					accept(observer.takeRecords());
					enabled = false;
					cancelAnimationFrame(raf);
					performance.mark('astra-perf-end');
					if (window.__observerCost) window.__observerCost.enabled = false;
					return {
						durationMs: performance.now() - started,
						bcr: countReads ? bcr : null,
						computedStyles: countReads ? styles : null,
						frameIntervals,
						entries,
						supported,
						observerCost: window.__observerCost ? { ...window.__observerCost } : undefined,
						activeAtDeadline: window.__motionPerf.stats().active,
						nativeAtDeadline: document.getAnimations().length
					};
				}
			};
		},
		{ countReads: !args['no-reads'] }
	);
}

async function workload(page, total = steps) {
	return page.evaluate(
		async ({ total, gap, settle }) => {
			const sequence = ['reverse', 'resize', 'remove', 'undo', 'rotate', 'resize'];
			const transactions = [];
			const begin = performance.now();
			for (let i = 0; i < total; i++) {
				const actualStart = performance.now();
				const kind = sequence[i % sequence.length];
				const transactionMs = window.__motionPerf.mutate(kind);
				transactions.push({
					kind,
					transactionMs,
					offsetMs: actualStart - begin,
					scheduleLagMs: Math.max(0, actualStart - begin - i * gap)
				});
				await new Promise((done) =>
					setTimeout(done, Math.max(0, begin + (i + 1) * gap - performance.now()))
				);
			}
			const interactionMs = performance.now() - begin;
			await new Promise((done) => setTimeout(done, settle));
			return { transactions, interactionMs };
		},
		{ total, gap, settle }
	);
}

async function settled(page) {
	await page.waitForFunction(
		() => window.__motionPerf.stats().active === 0 && document.getAnimations().length === 0,
		undefined,
		{ timeout: 10000 }
	);
	await frame(page);
	const correct = await page.evaluate(() => {
		const report = window.__motionPerf.verify();
		const nodes = [...document.querySelectorAll('[data-cell]')];
		let minimumOpacity = 1,
			outOfFlow = 0,
			inert = 0;
		for (const node of nodes) {
			const style = getComputedStyle(node);
			minimumOpacity = Math.min(minimumOpacity, Number(style.opacity));
			if (style.position === 'absolute') outOfFlow++;
			if (node.inert) inert++;
		}
		return { ...report, minimumOpacity, outOfFlow, inert };
	});
	if (
		!correct.orderMatches ||
		correct.domCount !== correct.expectedCount ||
		correct.uniqueCount !== correct.expectedCount ||
		correct.maximumResidualTransform > 0.05 ||
		correct.minimumOpacity < 0.99 ||
		correct.outOfFlow ||
		correct.inert
	)
		throw new Error(`Incorrect final layout: ${JSON.stringify(correct)}`);
	return correct;
}

async function trial(session, count, mode, rate, iteration) {
	const { page, cdp } = session;
	await page.evaluate(() => window.__motionPerf.mutate('reset'));
	await page.waitForTimeout(settle);
	await page.evaluate(() => window.__perfProbe.start());
	await frame(page);
	const before = await metrics(cdp);
	const activity = await workload(page);
	const after = await metrics(cdp);
	const probe = await page.evaluate(() => window.__perfProbe.stop());
	const correct = await settled(page);
	const row = {
		count,
		mode,
		rate,
		iteration,
		...activity,
		...difference(before, after),
		durationMs: probe.durationMs,
		bcr: probe.bcr,
		computedStyles: probe.computedStyles,
		frameCount: probe.frameIntervals.length,
		medianFrameMs: quantile(probe.frameIntervals, 0.5),
		p95FrameMs: quantile(probe.frameIntervals, 0.95),
		maximumFrameMs: Math.max(0, ...probe.frameIntervals),
		framesOver25ms: probe.frameIntervals.filter((value) => value > 25).length,
		estimatedMissed60HzRafs: probe.frameIntervals.reduce(
			(sum, value) => sum + Math.max(0, Math.round(value / (1000 / 60)) - 1),
			0
		),
		longAnimationFrames: probe.supported.includes('long-animation-frame')
			? probe.entries.filter((entry) => entry.type === 'long-animation-frame').length
			: null,
		longTasks: probe.supported.includes('longtask')
			? probe.entries.filter((entry) => entry.type === 'longtask').length
			: null,
		forcedStyleLayoutMsInLongFrames: probe.supported.includes('long-animation-frame')
			? probe.entries
					.filter((entry) => entry.type === 'long-animation-frame')
					.reduce((sum, entry) => sum + entry.forcedMs, 0)
			: null,
		observerCost: probe.observerCost,
		activeAtDeadline: probe.activeAtDeadline,
		nativeAtDeadline: probe.nativeAtDeadline,
		correctness: correct,
		maxTransactionMs: Math.max(...activity.transactions.map((entry) => entry.transactionMs)),
		medianTransactionMs: quantile(
			activity.transactions.map((entry) => entry.transactionMs),
			0.5
		),
		maxScheduleLagMs: Math.max(...activity.transactions.map((entry) => entry.scheduleLagMs))
	};
	return row;
}

async function idle(page, ms = 700) {
	await page.evaluate(() => window.__perfProbe.start());
	await page.waitForTimeout(ms);
	const probe = await page.evaluate(() => window.__perfProbe.stop());
	return {
		durationMs: probe.durationMs,
		bcr: probe.bcr,
		computedStyles: probe.computedStyles,
		frames: probe.frameIntervals.length,
		active: probe.activeAtDeadline,
		native: probe.nativeAtDeadline
	};
}

async function memoryRun(count, mode) {
	const session = await open(count, mode, 1);
	const { page, cdp, browser } = session;
	try {
		await page.evaluate(() => window.__motionPerf.setMounted(false));
		async function churn(n) {
			return page.evaluate(async (n) => {
				for (let index = 0; index < n; index++) {
					await window.__motionPerf.setMounted(true);
					window.__motionPerf.mutate('reverse');
					await new Promise((done) => setTimeout(done, 45));
					window.__motionPerf.mutate('remove');
					await new Promise((done) => setTimeout(done, 15));
					await window.__motionPerf.setMounted(false);
				}
				return { ...window.__motionPerf.verify(), native: document.getAnimations().length };
			}, n);
		}
		async function checkpoint(iteration) {
			await page.waitForTimeout(150);
			await cdp.send('HeapProfiler.collectGarbage');
			await cdp.send('HeapProfiler.collectGarbage');
			const heap = await cdp.send('Runtime.getHeapUsage');
			const dom = await cdp.send('Memory.getDOMCounters');
			return { iteration, heap, dom };
		}
		await churn(3);
		const checkpoints = [await checkpoint(0)];
		let cleanup;
		for (let completed = 0; completed < cycles;) {
			const batch = Math.min(10, cycles - completed);
			cleanup = await churn(batch);
			completed += batch;
			if (
				cleanup.domCount !== 0 ||
				cleanup.native !== 0 ||
				cleanup.lastDisposedStats?.participants !== 0 ||
				cleanup.lastDisposedStats?.active !== 0
			)
				throw new Error(`Cleanup failed: ${JSON.stringify(cleanup)}`);
			checkpoints.push(await checkpoint(completed));
		}
		let detached;
		try {
			const data = await cdp.send('DOM.getDetachedDomNodes');
			detached = {
				roots: data.detachedNodes.length,
				retainedNodeIds: data.detachedNodes.reduce(
					(sum, entry) => sum + entry.retainedNodeIds.length,
					0
				)
			};
		} catch (error) {
			detached = { unavailable: String(error) };
		}
		return {
			count,
			mode,
			rate: 1,
			warmupCycles: 3,
			measuredCycles: cycles,
			checkpoints,
			cleanup,
			detached,
			idleAfterDestroy: await idle(page),
			errors: session.errors
		};
	} finally {
		await browser.close();
	}
}

async function traceRun(count, mode, rate) {
	const session = await open(count, mode, rate, true);
	const { page, cdp, browser } = session;
	let sampler;
	try {
		await workload(page, 6);
		await settled(page);
		let peakActive = 0;
		// Deliberately separate from primary timing: diagnostics traverse active participants.
		sampler = setInterval(async () => {
			try {
				peakActive = Math.max(
					peakActive,
					await page.evaluate(() => window.__motionPerf.stats().active)
				);
			} catch {
				/* closing diagnostic page */
			}
		}, 100);
		await cdp.send('Tracing.start', {
			categories: 'devtools.timeline,blink.user_timing,toplevel,cc,gpu,v8',
			transferMode: 'ReturnAsStream'
		});
		const row = await trial(session, count, mode, rate, 'trace');
		clearInterval(sampler);
		const complete = new Promise((done) => cdp.once('Tracing.tracingComplete', done));
		await cdp.send('Tracing.end');
		const { stream } = await complete;
		let raw = '';
		for (;;) {
			const chunk = await cdp.send('IO.read', { handle: stream });
			raw += chunk.data;
			if (chunk.eof) break;
		}
		await cdp.send('IO.close', { handle: stream });
		await mkdir(args['trace-dir'], { recursive: true });
		const path = resolve(args['trace-dir'], `layout-${count}-${mode}-${rate}x.json`);
		await writeFile(path, raw);
		const events = JSON.parse(raw).traceEvents;
		const names = new Map(
			events
				.filter((event) => event.name === 'thread_name')
				.map((event) => [`${event.pid}:${event.tid}`, event.args.name])
		);
		const begin = events.find((event) => event.name === 'astra-perf-start');
		const end = events.findLast((event) => event.name === 'astra-perf-end');
		const groups = new Map();
		for (const event of events) {
			if (event.ph !== 'X' || !event.dur || event.ts < begin.ts || event.ts > end.ts) continue;
			const thread = names.get(`${event.pid}:${event.tid}`) ?? `${event.pid}:${event.tid}`;
			const key = `${thread}:${event.name}`;
			if (!groups.has(key))
				groups.set(key, { thread, name: event.name, count: 0, inclusiveMs: 0, maximumMs: 0 });
			const group = groups.get(key);
			group.count++;
			group.inclusiveMs += event.dur / 1000;
			group.maximumMs = Math.max(group.maximumMs, event.dur / 1000);
		}
		return {
			count,
			mode,
			rate,
			path,
			bytes: raw.length,
			sha256: createHash('sha256').update(raw).digest('hex'),
			eventCount: events.length,
			peakActive,
			row,
			inclusiveCategoriesOverlap: true,
			topEvents: [...groups.values()].sort((a, b) => b.inclusiveMs - a.inclusiveMs).slice(0, 40)
		};
	} finally {
		clearInterval(sampler);
		await browser.close();
	}
}

try {
	for (const rate of args['traces-only'] ? [] : rates)
		for (const count of counts) {
			// Rotate mode order across configurations; repeat samples remain within one warmed browser.
			const offset = (rates.indexOf(rate) + counts.indexOf(count)) % modes.length;
			for (const mode of [...modes.slice(offset), ...modes.slice(0, offset)]) {
				const session = await open(count, mode, rate);
				try {
					await workload(session.page, 6);
					await settled(session.page);
					await workload(session.page, 6);
					await settled(session.page);
					const initial = await session.page.evaluate(() => window.__motionPerf.verify());
					const idleMounted = await idle(session.page);
					for (let iteration = 0; iteration < repeats; iteration++) {
						const row = await trial(session, count, mode, rate, iteration);
						row.idleMounted = idleMounted;
						row.initial = initial;
						row.errors = [...session.errors];
						result.rows.push(row);
						await save();
						console.log(
							JSON.stringify({
								count,
								mode,
								rate,
								iteration,
								maximumFrameMs: row.maximumFrameMs,
								p95FrameMs: row.p95FrameMs,
								ScriptDuration: row.ScriptDuration,
								bcr: row.bcr,
								activeAtDeadline: row.activeAtDeadline
							})
						);
					}
				} finally {
					await session.browser.close();
				}
			}
		}
	if (cycles > 0 && !args['traces-only'])
		for (const mode of modes) {
			result.memory.push(await memoryRun(Math.max(...counts), mode));
			await save();
		}
	if (args.traces)
		for (const mode of modes) {
			result.traces.push(
				await traceRun(Math.max(...counts), mode, rates.includes(4) ? 4 : Math.max(...rates))
			);
			await save();
		}
	result.status = 'complete';
	result.environment.loadAtEnd = loadavg();
	await save();
} catch (error) {
	result.status = 'failed';
	result.failure = String(error.stack ?? error);
	await save();
	throw error;
}
