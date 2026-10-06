import { mount, unmount, flushSync } from 'svelte';
import Staged from './Staged.svelte';
import Managed from './Managed.svelte';
import { initial } from './model.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rect = (node) => {
	const { x, y, width, height } = node.getBoundingClientRect();
	return { x, y, width, height };
};
const error = (a, b) => Math.max(...Object.keys(a).map((key) => Math.abs(a[key] - b[key])));

export async function probe(host, name, mode = 'astra-staged') {
	const count = 30;
	const start = initial(count);
	const app =
		mode === 'react'
			? (await import('./react.jsx')).start(host, { count })
			: mount(mode === 'astra-managed-staged' ? Managed : Staged, {
					target: host,
					props: { count, staged: true, unstaged: name === 'unowned-parent' }
				});
	const dispose = () => (mode === 'react' ? app.destroy() : unmount(app));
	flushSync();
	const find = (id) => host.querySelector(`[data-cell="${id}"]`);
	try {
		await sleep(500);
		app.enableDiagnostics?.();
		let outgoing = [0, 5];
		if (name === 'interrupted') {
			app.mutate('reverse');
			await sleep(90);
		}
		if (name === 'transformed' || name === 'transformed-fixed-origin') {
			host.style.transform = 'translate(13.5px, 8.25px) scale(1.25)';
			if (name === 'transformed-fixed-origin') host.style.transformOrigin = '0 0';
			await sleep(100);
		}
		const before = new Map(outgoing.map((id) => [id, rect(find(id))]));
		const identity = find(0);
		const samples = [];
		const observer = new MutationObserver(() => {
			for (const id of outgoing) {
				const node = find(id);
				if (
					node &&
					getComputedStyle(node).position === 'absolute' &&
					!samples.some((sample) => sample.id === id)
				)
					samples.push({ id, errorPx: error(before.get(id), rect(node)) });
			}
		});
		observer.observe(host, { attributes: true, childList: true, subtree: true });
		const next = {
			columns: 5,
			items: [...app.expected()].reverse().filter((id) => !outgoing.includes(id))
		};
		if (name === 'external-write') host.querySelector('.grid').style.width = '420px';
		app.request(next);
		if (name === 'coalesced') app.request({ ...next, items: next.items.filter((id) => id !== 10) });
		if (name === 'cancel-before-commit') app.request(start);
		if (name === 'reentry') {
			await sleep(60);
			app.request(start);
		}
		if (name === 'dispose-pending') {
			await dispose();
			await sleep(450);
			observer.disconnect();
			return { name, mode, passed: host.childElementCount === 0, count: host.childElementCount };
		}
		await sleep(900);
		observer.disconnect();
		const expected =
			name === 'reentry' || name === 'cancel-before-commit'
				? start.items
				: name === 'coalesced'
					? next.items.filter((id) => id !== 10)
					: next.items;
		const actual = [...host.querySelectorAll('[data-cell]')].map((node) => +node.dataset.cell);
		const stats = app.stats?.() ?? { active: 0, exiting: 0 };
		const events = app.events?.() ?? [];
		const maxErrorPx = Math.max(0, ...samples.map((sample) => sample.errorPx));
		const geometryPassed =
			name === 'cancel-before-commit'
				? samples.length === 0
				: samples.length === 2 && maxErrorPx <= 0.75;
		const orderPassed = JSON.stringify(actual) === JSON.stringify(expected);
		const reentryPassed =
			name !== 'reentry' ||
			(find(0) === identity &&
				Number(getComputedStyle(identity).opacity) === 1 &&
				identity.style.position === '');
		const phasePassed = events.every(
			(event, i) => event.phase !== 'snapshot' || event.columns === events[i - 1].columns
		);
		return {
			name,
			mode,
			passed:
				geometryPassed &&
				orderPassed &&
				reentryPassed &&
				phasePassed &&
				stats.active === 0 &&
				stats.exiting === 0,
			geometryPassed,
			orderPassed,
			reentryPassed,
			phasePassed,
			maxErrorPx,
			samples,
			stats,
			events,
			reentry:
				name === 'reentry'
					? {
							identity: find(0) === identity,
							opacity: getComputedStyle(identity).opacity,
							position: identity.style.position
						}
					: null
		};
	} finally {
		if (name !== 'dispose-pending') await dispose();
		host.replaceChildren();
		host.style.transform = '';
		host.style.transformOrigin = '';
	}
}
