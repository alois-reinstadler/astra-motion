/** Publish the latest request outside Svelte's effect flush, with no frame delay. */
export function scheduleLatest(commit) {
	let latest;
	let queued = false;
	let alive = true;
	return {
		set value(next) {
			latest = next;
			if (queued || !alive) return;
			queued = true;
			queueMicrotask(() => {
				queued = false;
				if (alive) commit(latest);
			});
		},
		dispose() {
			alive = false;
		}
	};
}
