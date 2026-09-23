// Browser-side cases shared by the existing Playwright package qualification and
// Chrome MCP. No repository imports, engine internals or alternate browser launcher.
function assert(condition, message) {
	if (!condition) throw new Error(message);
}
function node(selector, root = document) {
	const found = root.querySelector(selector);
	assert(found, `Missing ${selector}`);
	return found;
}
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
async function until(predicate, message, timeout = 3000) {
	const start = performance.now();
	while (!predicate()) {
		assert(performance.now() - start < timeout, `Timed out: ${message}`);
		await frame();
	}
}
function click(label) {
	const button = [...document.querySelectorAll('button')].find(
		(node) => node.textContent.trim() === label
	);
	assert(button, `Missing button ${label}`);
	button.click();
}
const x = (node) => new DOMMatrix(getComputedStyle(node).transform).m41;
const bindings = () => JSON.parse(node('[data-bindings]').textContent);
const outcome = () => JSON.parse(node('[data-outcome]').textContent || 'null');
const passed = (name) => ({ case: name, passed: true });

export async function checkErgonomics() {
	assert(location.pathname === '/ergonomics', 'Start on /ergonomics');
	await until(() => node('main').dataset.hydrated === 'true', 'hydration');
	const results = [];
	const response = await fetch('/ergonomics', { cache: 'no-store' });
	assert(response.ok, 'SSR response failed');
	const server = new DOMParser().parseFromString(await response.text(), 'text/html');
	const inherited = node('[data-inherited]', server);
	assert(inherited.style.opacity === '0.65', 'Inherited SSR opacity missing');
	assert(new DOMMatrix(inherited.style.transform).m41 === 24, 'Inherited SSR transform missing');
	assert(
		getComputedStyle(node('[data-inherited]')).opacity === '0.65',
		'Hydrated inherited opacity differs'
	);
	assert(x(node('[data-inherited]')) === 24, 'Hydrated inherited transform differs');
	results.push(passed('inherited variant pose in raw SSR and hydrated HTML'));

	const targets = ['[data-nested]', '[data-nested-direct]', '[data-nested-getter]'].map(
		(selector) => node(selector)
	);
	assert(
		targets.every((target) => x(target) === 0),
		'Unexpected initial nested targets'
	);
	click('Change nested target');
	await until(
		() => targets.every((target) => x(target) === 80),
		'nested mutation across tag/direct/getter'
	);
	click('Replace nested target');
	await until(
		() => targets.every((target) => x(target) === 160),
		'nested replacement across tag/direct/getter'
	);
	assert(
		targets.every((target) => target.isConnected),
		'Nested update replaced a native node'
	);
	results.push(passed('nested mutation and replacement without remount, tag/direct/getter'));

	const text = node('[aria-label=Text]');
	const amount = node('[aria-label=Amount]');
	const checkbox = node('[aria-label=Checked]');
	assert(bindings().tag === 'BUTTON', 'Native DOM ref missing');
	click('Update bindings');
	await until(
		() => text.value === 'parent update' && amount.value === '7' && checkbox.checked,
		'parent-to-DOM bindings'
	);
	text.value = 'typed text';
	text.dispatchEvent(new Event('input', { bubbles: true }));
	await until(() => bindings().text === 'typed text', 'DOM-to-parent text binding');
	assert(
		bindings().inputEvents === 1 && bindings().eventTag === 'INPUT',
		'Input event missing, duplicated or wrong currentTarget'
	);
	amount.value = '4';
	amount.dispatchEvent(new Event('input', { bubbles: true }));
	await until(() => bindings().amount === 4, 'numeric binding must be a number');
	amount.value = '';
	amount.dispatchEvent(new Event('input', { bubbles: true }));
	await until(() => bindings().amount === null, 'empty numeric binding');
	checkbox.click();
	await until(() => bindings().checked === false, 'checkbox binding');
	const action = [...document.querySelectorAll('button')].find(
		(node) => node.textContent.trim() === 'Native action'
	);
	click('Native action');
	await until(() => bindings().clicks === 1, 'forwarded click');
	assert(bindings().eventTag === 'BUTTON', 'Button event currentTarget is not native');
	click('Toggle native action');
	await until(() => !action.isConnected && bindings().tag === null, 'ref cleanup');
	click('Toggle native action');
	await until(() => bindings().tag === 'BUTTON', 'replacement DOM ref');
	click('Native action');
	await until(() => bindings().clicks === 2, 'replacement event forwarded exactly once');
	results.push(passed('native text/number/checkbox bindings, typed refs, events and ref cleanup'));

	const target = node('[data-timeline]');
	click('Play timeline');
	await until(() => Number(getComputedStyle(target).opacity) < 0.99, 'timeline started');
	assert(outcome() === null, 'Timeline settled before cancellation');
	click('Stop timeline');
	await until(() => outcome()?.status === 'cancelled', 'cancelled settlement');
	assert(outcome().reason === 'stopped', 'Wrong cancellation reason');
	const stopped = Number(getComputedStyle(target).opacity);
	await frame();
	await frame();
	assert(
		Math.abs(Number(getComputedStyle(target).opacity) - stopped) < 0.01,
		'Stopped timeline still moves'
	);
	results.push(passed('timeline stop settles cancelled and holds its pose'));
	click('Play timeline');
	await until(() => outcome() === null, 'fresh settlement on replay');
	await until(() => Number(getComputedStyle(target).opacity) < 0.99, 'replayed timeline started');
	click('Toggle reduced motion');
	await until(
		() => outcome()?.status === 'finished',
		'live local policy finishes original playback'
	);
	assert(Number(getComputedStyle(target).opacity) === 0.25, 'Reduction did not reach final pose');
	results.push(passed('live local reduced-motion policy finishes replay with a fresh settlement'));
	return results;
}

export async function checkHandoff() {
	assert(location.pathname === '/handoff', 'Start on /handoff');
	assert(
		typeof document.startViewTransition === 'function',
		'This browser cannot exercise shared route snapshots'
	);
	await until(() => node('main').dataset.hydrated === 'true', 'hydration');
	const source = node('[data-route-source]');
	const sibling = node('[data-unrelated-exit]');
	const original = document.startViewTransition;
	const diagnostics = [];
	const warn = console.warn;
	let transition;
	let oldName;
	let heldExit;
	const holdExit = async () => {
		// Pause Svelte's actual retention animation. A slow machine must not pass
		// merely because the unrelated exit finished before the incoming capture.
		await until(
			() => sibling.getAnimations().some((animation) => animation.playState === 'running'),
			'unrelated exit started'
		);
		heldExit = sibling.getAnimations().find((animation) => animation.playState === 'running');
		heldExit.pause();
		heldExit.currentTime = 400;
	};
	let holding;
	const onOutro = () => {
		holding = holdExit();
	};
	sibling.addEventListener('outrostart', onOutro, { once: true });
	console.warn = (...args) => {
		diagnostics.push(args.map(String).join(' '));
		warn.apply(console, args);
	};
	document.startViewTransition = function (...args) {
		oldName = getComputedStyle(source).viewTransitionName;
		transition = original.apply(this, args);
		return transition;
	};
	try {
		node('a[href="/handoff/detail"]').click();
		await until(() => !!transition, 'native route transition');
		await transition.ready;
		// Kit's incoming capture can be ready before Svelte starts its deferred outro.
		await until(() => !!holding, 'native unrelated outro');
		await holding;
		const destination = node('[data-route-destination]');
		assert(
			source.isConnected && !source.closest('[inert]'),
			'Did not exercise retained non-inert source'
		);
		assert(
			sibling.isConnected && heldExit?.playState === 'paused',
			'Unrelated exit was not retained'
		);
		assert(oldName && oldName !== 'none', 'Outgoing shared identity was not captured');
		assert(
			getComputedStyle(source).viewTransitionName === 'none',
			'Retained source still claims shared identity'
		);
		assert(
			getComputedStyle(destination).viewTransitionName === oldName,
			'Incoming shared pair was skipped'
		);
		assert(diagnostics.length === 0, `Route diagnostics: ${diagnostics.join('; ')}`);
		heldExit.play();
		await transition.finished;
		await until(() => !source.isConnected && !sibling.isConnected, 'retained source cleanup');
		assert(destination.isConnected, 'Destination removed during cleanup');
		return {
			...passed('shared route handoff while unrelated exit retains a non-inert source'),
			oldName
		};
	} finally {
		document.startViewTransition = original;
		console.warn = warn;
		sibling.removeEventListener('outrostart', onOutro);
		heldExit?.play();
	}
}
