export const modes = [
	'react',
	'astra-native',
	'astra-explicit',
	'astra-managed',
	'astra-staged',
	'astra-managed-staged'
];
export const workloads = ['reverse', 'resize', 'single-exit', 'remove100', 'remove500'];
export const initial = (count = 500) => ({
	items: Array.from({ length: count }, (_, id) => id),
	columns: 10
});
export function change(state, workload) {
	if (!workloads.includes(workload)) throw new Error(`Unknown workload: ${workload}`);
	if (workload === 'reverse') return { ...state, items: [...state.items].reverse() };
	if (workload === 'resize') return { ...state, columns: state.columns === 10 ? 5 : 10 };
	const remove = workload === 'single-exit' ? 1 : Number(workload.slice(6));
	// Distributed removal makes geometry errors visible, not just trailing-row deletion.
	const removed = new Set(
		state.items
			.filter((_, index) => index % Math.max(1, Math.floor(state.items.length / remove)) === 0)
			.slice(0, remove)
	);
	return { ...state, items: state.items.filter((id) => !removed.has(id)) };
}
export function percentile(values, p) {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null;
}
