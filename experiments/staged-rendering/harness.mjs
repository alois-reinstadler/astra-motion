import { modes, workloads, initial, change, percentile } from './model.mjs';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const frame = () =>
	new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			cancelAnimationFrame(id);
			reject(new Error('Animation frames unavailable: foreground the preview and rerun.'));
		}, 2500);
		const id = requestAnimationFrame((time) => {
			clearTimeout(timeout);
			resolve(time);
		});
	});
const cells = (host) => [...host.querySelectorAll('[data-cell]')];
const rect = (node) => {
	const r = node.getBoundingClientRect();
	return { x: r.x, y: r.y, width: r.width, height: r.height };
};
export function validateOptions({
	mode = 'react',
	workload = 'reverse',
	count = 500,
	warmups = 1,
	trials = 3,
	diagnostic = false,
	observationMs = 1000
} = {}) {
	if (!modes.includes(mode) || !workloads.includes(workload))
		throw new Error('Unknown mode/workload');
	for (const [name, value, min, max] of [
		['count', count, 1, 1000],
		['warmups', warmups, 0, 3],
		['trials', trials, 1, 10],
		['observationMs', observationMs, 800, 5000]
	])
		if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${name}`);
	return { mode, workload, count, warmups, trials, diagnostic: !!diagnostic, observationMs };
}
function instrument() {
	const counts = {};
	const sites = {};
	const restore = [];
	let enabled = true;
	const hit = (name) => {
		if (!enabled) return;
		counts[name] = (counts[name] ?? 0) + 1;
		const stack = new Error().stack.split('\n').slice(3, 6).join('\n');
		sites[`${name}\n${stack}`] = (sites[`${name}\n${stack}`] ?? 0) + 1;
	};
	for (const [object, name] of [
		[window, 'getComputedStyle'],
		[Element.prototype, 'getBoundingClientRect']
	]) {
		const original = object[name];
		object[name] = function (...args) {
			hit(name);
			return original.apply(this, args);
		};
		restore.push(() => (object[name] = original));
	}
	for (const name of [
		'offsetWidth',
		'offsetHeight',
		'offsetTop',
		'offsetLeft',
		'offsetParent',
		'clientWidth',
		'clientHeight'
	]) {
		const descriptor =
			Object.getOwnPropertyDescriptor(HTMLElement.prototype, name) ??
			Object.getOwnPropertyDescriptor(Element.prototype, name);
		const object = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)
			? HTMLElement.prototype
			: Element.prototype;
		if (descriptor?.get && descriptor.configurable) {
			Object.defineProperty(object, name, {
				...descriptor,
				get() {
					hit(name);
					return descriptor.get.call(this);
				}
			});
			restore.push(() => Object.defineProperty(object, name, descriptor));
		}
	}
	return {
		counts,
		sites,
		pause() {
			enabled = false;
		},
		resume() {
			enabled = true;
		},
		stop() {
			for (const reset of restore.reverse()) reset();
		}
	};
}
async function mount(host, mode, count) {
	if (mode === 'react') return (await import('./react.jsx')).start(host, { count });
	const { mount, unmount, flushSync } = await import('svelte');
	const { default: App } =
		mode === 'astra-staged'
			? await import('./Staged.svelte')
			: mode === 'astra-managed' || mode === 'astra-managed-staged'
				? await import('./Managed.svelte')
				: await import('./Native.svelte');
	const app = mount(App, {
		target: host,
		props: { count, automatic: mode !== 'astra-explicit', staged: mode === 'astra-managed-staged' }
	});
	flushSync();
	return {
		mutate: app.mutate,
		expected: app.expected,
		stats: app.stats,
		destroy: () => unmount(app)
	};
}
function verify(host, api, expected) {
	const nodes = cells(host);
	const ids = nodes.map((n) => Number(n.dataset.cell));
	let residual = 0;
	for (const node of nodes) {
		const m = new DOMMatrix(getComputedStyle(node).transform);
		residual = Math.max(
			residual,
			Math.abs(m.m41),
			Math.abs(m.m42),
			Math.abs(m.m11 - 1),
			Math.abs(m.m22 - 1)
		);
	}
	const animations = host
		.getAnimations({ subtree: true })
		.filter((a) => a.playState === 'running').length;
	const stats = api.stats?.();
	const orderMatches =
		JSON.stringify(ids) === JSON.stringify(expected) &&
		JSON.stringify(api.expected()) === JSON.stringify(expected);
	const passed =
		orderMatches && residual < 0.01 && animations === 0 && (!stats || stats.active === 0);
	return { passed, count: ids.length, orderMatches, residual, animations, stats };
}
async function idleCadence() {
	const gaps = [];
	let previous = await frame();
	for (let i = 0; i < 8; i++) {
		const now = await frame();
		gaps.push(now - previous);
		previous = now;
		if (gaps.length >= 3 && percentile(gaps, 0.5) > 50) break;
	}
	return { gaps, medianMs: percentile(gaps, 0.5), valid: percentile(gaps, 0.5) <= 50 };
}
export function createHarness(host, provenance) {
	let busy = false;
	let active;
	const results = [];
	async function trial(options) {
		if (active) {
			await active.destroy();
			active = null;
			host.replaceChildren();
			await frame();
		}
		const api = (active = await mount(host, options.mode, options.count));
		await sleep(500);
		await frame();
		await frame();
		const expected = change(initial(options.count), options.workload).items;
		const surviving = new Set(expected);
		const exiting = cells(host).filter((n) => !surviving.has(Number(n.dataset.cell)));
		const before = options.diagnostic ? new Map(exiting.map((n) => [n, rect(n)])) : null;
		const sampleNode = cells(host).find((n) => surviving.has(Number(n.dataset.cell)));
		let raf;
		let previous = await frame();
		let start = 0;
		let exitCompleteMs = null;
		let movingFrames = 0;
		const gaps = [];
		const entries = [];
		let geometrySamples = 0;
		let maxExitError = 0;
		let poppedSamples = 0;
		const removalObserver = new MutationObserver(() => {
			if (
				start &&
				exiting.length &&
				exitCompleteMs === null &&
				exiting.every((n) => !n.isConnected)
			)
				exitCompleteMs = performance.now() - start;
		});
		if (exiting.length) removalObserver.observe(host, { childList: true, subtree: true });
		const supported = PerformanceObserver.supportedEntryTypes ?? [];
		const types = ['longtask', 'long-animation-frame'].filter((t) => supported.includes(t));
		const observer = new PerformanceObserver((list) =>
			entries.push(
				...list.getEntries().map((e) => ({
					type: e.entryType,
					duration: e.duration,
					forcedStyleAndLayoutMs: (e.scripts ?? []).reduce(
						(sum, s) => sum + (s.forcedStyleAndLayoutDuration ?? 0),
						0
					)
				}))
			)
		);
		if (types.length) observer.observe({ entryTypes: types });
		// Geometry assertions and API instrumentation are diagnostic-only. Neither affects timing trials.
		const measured = new Set();
		const geometry = () => {
			diagnostic.pause();
			for (const node of exiting) {
				if (
					!node.isConnected ||
					measured.has(node) ||
					getComputedStyle(node).position !== 'absolute'
				)
					continue;
				measured.add(node);
				const now = rect(node);
				const old = before.get(node);
				geometrySamples++;
				poppedSamples++;
				for (const key of ['x', 'y', 'width', 'height'])
					maxExitError = Math.max(maxExitError, Math.abs(now[key] - old[key]));
			}
			diagnostic.resume();
		};
		const geometryObserver = options.diagnostic ? new MutationObserver(geometry) : null;
		geometryObserver?.observe(host, { attributes: true, childList: true, subtree: true });
		geometryObserver?.observe(document.head, { childList: true, subtree: true });
		const sample = (t) => {
			gaps.push(t - previous);
			previous = t;
			if (sampleNode?.style.transform && sampleNode.style.transform !== 'none') movingFrames++;
			raf = requestAnimationFrame(sample);
		};
		raf = requestAnimationFrame(sample);
		const diagnostic = options.diagnostic ? instrument() : null;
		start = performance.now();
		let mutationMs;
		try {
			api.mutate(options.workload);
			mutationMs = performance.now() - start;
			// Catch synchronous pops and subsequent pop writes before an exit can complete.
			if (options.diagnostic) geometry();
			await sleep(options.observationMs);
		} finally {
			geometryObserver?.disconnect();
			diagnostic?.stop();
			cancelAnimationFrame(raf);
			observer.disconnect();
			removalObserver.disconnect();
		}
		const elapsedMs = performance.now() - start;
		const correctness = verify(host, api, expected);
		const geometryResult =
			options.diagnostic && exiting.length
				? {
						passed:
							geometrySamples === exiting.length &&
							poppedSamples === exiting.length &&
							maxExitError <= 0.75,
						sampled: geometrySamples,
						expected: exiting.length,
						poppedSamples,
						maxErrorPx: maxExitError
					}
				: null;
		const passed =
			correctness.passed &&
			(!exiting.length || exitCompleteMs !== null) &&
			(!geometryResult || geometryResult.passed);
		return {
			passed,
			mutationMs,
			elapsedMs,
			exitCompleteMs,
			frames: gaps.length,
			p95RafGapMs: percentile(gaps, 0.95),
			maxRafGapMs: Math.max(...gaps),
			over25Ms: gaps.filter((n) => n > 25).length,
			movingFrames,
			entries,
			correctness,
			exitGeometry: geometryResult,
			reads: diagnostic
				? {
						counts: diagnostic.counts,
						sites: diagnostic.sites,
						window: 'mutation through observation window; excludes assertion reads'
					}
				: null
		};
	}
	return {
		provenance,
		modes,
		workloads,
		results,
		async runCase(input = {}) {
			if (busy) throw new Error('A benchmark is already running');
			if (!provenance.production) throw new Error('Build production first');
			const options = validateOptions(input);
			if (document.visibilityState !== 'visible') throw new Error('Keep benchmark visible');
			busy = true;
			try {
				const cadence = await idleCadence();
				if (!cadence.valid && !options.diagnostic)
					throw new Error(
						`Timing invalid: idle RAF median ${cadence.medianMs.toFixed(1)}ms. Bring preview to foreground and rerun. Diagnostics remain available.`
					);
				const environment = {
					idleRafCadence: cadence,
					userAgent: navigator.userAgent,
					width: innerWidth,
					height: innerHeight,
					dpr: devicePixelRatio,
					visibility: document.visibilityState,
					hardwareConcurrency: navigator.hardwareConcurrency,
					cpuThrottle: 'external; record separately'
				};
				for (let i = 0; i < options.warmups; i++) await trial({ ...options, diagnostic: false });
				const rows = [];
				for (let i = 0; i < options.trials; i++) rows.push(await trial(options));
				const result = {
					schemaVersion: 1,
					createdAt: new Date().toISOString(),
					provenance,
					environment,
					options,
					validTiming: cadence.valid && !options.diagnostic,
					passed: rows.every((r) => r.passed) && document.visibilityState === 'visible',
					rows
				};
				results.push(result);
				return result;
			} finally {
				busy = false;
			}
		},
		async clear() {
			if (busy) throw new Error('Benchmark busy');
			if (active) await active.destroy();
			active = null;
			host.replaceChildren();
		},
		export() {
			return JSON.stringify(results, null, 2);
		}
	};
}
