import './style.css';
import { createHarness } from './harness.mjs';
const errors = [];
window.addEventListener('error', (event) => errors.push({ type: 'error', message: event.message }));
window.addEventListener('unhandledrejection', (event) =>
	errors.push({ type: 'unhandledrejection', message: String(event.reason) })
);
const api = (window.__bench = createHarness(document.querySelector('#app'), __PROVENANCE__));
api.errors = errors;
window.__probe = async (name, mode) => {
	await api.clear();
	return (await import('./correctness.mjs')).probe(document.querySelector('#app'), name, mode);
};
const mode = document.querySelector('#mode');
const workload = document.querySelector('#workload');
for (const name of api.modes) mode.add(new Option(name, name));
for (const name of api.workloads) workload.add(new Option(name, name));
const output = document.querySelector('#output');
const run = document.querySelector('#run');
run.onclick = async () => {
	run.disabled = true;
	output.textContent = 'Running; keep this tab visible.';
	try {
		const result = await api.runCase({
			mode: mode.value,
			workload: workload.value,
			diagnostic: document.querySelector('#diagnostic').checked
		});
		output.textContent = JSON.stringify(result, null, 2);
	} catch (error) {
		output.textContent = String(error);
	} finally {
		run.disabled = false;
	}
};
document.querySelector('#download').onclick = () => {
	const url = URL.createObjectURL(new Blob([api.export()], { type: 'application/json' }));
	const a = document.createElement('a');
	a.href = url;
	a.download = 'react-astra-benchmark.json';
	a.click();
	URL.revokeObjectURL(url);
};
