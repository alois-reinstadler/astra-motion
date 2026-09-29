// Run this exported function in the managed page through chrome-devtools evaluate_script.
// It uses Motion's postRender phase as the synchronization signal, not timed sleeps.
import { frame } from 'motion';
export async function verifyExperiment() {
	const flush = () => new Promise((resolve) => frame.postRender(resolve));
	const buttons = [...document.querySelectorAll('button')];
	const read = async () => {
		buttons[3].click();
		await Promise.resolve();
		return JSON.parse(document.querySelector('[data-testid=inspection]').textContent);
	};
	const choose = async (value) => {
		const select = document.querySelector('select');
		select.value = value;
		select.dispatchEvent(new Event('change', { bubbles: true }));
		await Promise.resolve();
	};
	const checkbox = document.querySelector('input');
	if (checkbox.checked) checkbox.click();
	const complete = async (target) => {
		const deadline = performance.now() + 5000;
		while (performance.now() < deadline) {
			await flush();
			const data = await read();
			if (data.threlte.progress === target) return data;
		}
		throw Error('Animation did not reach expected endpoint');
	};
	// Fresh owned controllers.
	if (buttons[2].textContent === 'Unmount renderers') {
		buttons[2].click();
		await Promise.resolve();
	}
	buttons[2].click();
	await flush();
	await choose('svelte');
	buttons[0].click();
	const baseline = await complete(1);
	await choose('motion');
	buttons[0].click();
	const motion = await complete(0);
	buttons[0].click();
	await flush();
	await flush();
	buttons[1].click();
	// stop() may enqueue one final sampled value; flush that defined write phase.
	await flush();
	const stopped = await read();
	await flush();
	const afterStop = await read();
	if (stopped.threlte.progress !== afterStop.threlte.progress)
		throw Error('Value changed after stop flush');
	buttons[2].click();
	await flush();
	const unmounted = await read();
	if (unmounted.threlte.status !== 'unmounted') throw Error('Owner remained mounted');
	buttons[2].click();
	await flush();
	checkbox.click();
	await Promise.resolve();
	buttons[0].click();
	const reduced = await complete(1);
	if (document.documentElement.scrollWidth > innerWidth) throw Error('Horizontal overflow');
	return {
		baseline,
		motion,
		stopped,
		afterStop,
		unmounted,
		reduced,
		viewport: [innerWidth, innerHeight]
	};
}
