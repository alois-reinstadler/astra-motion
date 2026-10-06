<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { animate } from 'motion';
	import { createLayout } from '@astra/layout.js';
	import { reconcilePresence, type PresenceEntry } from '@astra/presence-model.js';
	import { measurePresenceBox } from '@astra/presence-measure.js';
	import { initial, change } from './model.mjs';
	import { scheduleLatest } from './schedule-latest.mjs';

	let { count, unstaged = false }: { count: number; unstaged?: boolean } = $props();
	let requested = $state.raw(untrack(() => initial(count)));
	let committed = $state.raw(untrack(() => requested));
	let entries = $state.raw<PresenceEntry<number>[]>(
		untrack(() =>
			reconcilePresence(
				[],
				requested.items.map((id: number) => ({ key: id, value: id })),
				'popLayout'
			)
		)
	);
	const layout = createLayout({
		automatic: false,
		reducedMotion: 'never',
		transition: { duration: 0.35, ease: 'linear' }
	});
	const nodes = new SvelteMap<number, HTMLElement>();
	const exits = new SvelteMap<
		number,
		{ cancel: () => void; restore: () => void; generation: number }
	>();
	const completed = new SvelteMap<number, number>();
	const counters = { commits: 0, removalCommits: 0, exitCaptures: 0, cancellations: 0 };
	let alive = true;
	let generation = 0;
	let removalFrame = 0;
	const trace: { phase: string; columns: string; ids: string[] }[] = [];
	let diagnostic = false;

	function record(phase: string) {
		if (!diagnostic) return;
		const node = nodes.values().next().value;
		trace.push({
			phase,
			columns: node?.parentElement?.style.gridTemplateColumns ?? '',
			ids: [...nodes.keys()].map(String)
		});
	}
	function register(id: number) {
		return (node: HTMLElement) => {
			nodes.set(id, node);
			return () => {
				nodes.delete(id);
			};
		};
	}
	function removeCompleted() {
		removalFrame = 0;
		if (!alive) return;
		const remove = new SvelteSet<number>();
		for (const [id, epoch] of completed) if (exits.get(id)?.generation === epoch) remove.add(id);
		completed.clear();
		if (!remove.size) return;
		counters.removalCommits++;
		layout.update(() => {
			entries = entries.filter((entry) => !remove.has(entry.value));
		});
		for (const id of remove) {
			exits.get(id)?.restore();
			exits.delete(id);
		}
	}
	function commit(next: typeof requested) {
		if (!alive || next === committed) return;
		const plan = reconcilePresence(
			entries,
			next.items.map((id: number) => ({ key: id, value: id })),
			'popLayout'
		);
		const outgoing = plan.filter((entry) => !entry.isPresent && !exits.has(entry.value));
		record('prepare');
		// ALL pop reads precede ALL pop writes and publication of parent styles.
		const captures = outgoing.map((entry) => {
			const node = nodes.get(entry.value)!;
			counters.exitCaptures++;
			return {
				id: entry.value,
				node,
				box: measurePresenceBox(node),
				original: Object.fromEntries(
					['position', 'left', 'top', 'width', 'height', 'box-sizing', 'opacity'].map((key) => [
						key,
						{
							value: node.style.getPropertyValue(key),
							priority: node.style.getPropertyPriority(key)
						}
					])
				)
			};
		});
		record('snapshot');
		counters.commits++;
		layout.update(() => {
			for (const entry of plan) {
				const exiting = exits.get(entry.value);
				if (entry.isPresent && exiting) {
					exiting.cancel();
					exiting.restore();
					animate(nodes.get(entry.value)!, { opacity: 1 }, { duration: 0 });
					exits.delete(entry.value);
					completed.delete(entry.value);
					counters.cancellations++;
				}
			}
			for (const { node, box } of captures) {
				Object.assign(node.style, {
					position: 'absolute',
					left: `${box.left}px`,
					top: `${box.top}px`,
					width: box.width,
					height: box.height,
					boxSizing: box.boxSizing
				});
			}
			committed = next;
			entries = plan;
		});
		record('commit');
		for (const { id, node, original } of captures) {
			const epoch = ++generation;
			const controls = animate(
				node,
				{ opacity: 0 },
				{ duration: 0.18, ease: (t: number) => 1 - (1 - t) ** 3 }
			);
			exits.set(id, {
				generation: epoch,
				cancel: () => controls.stop(),
				restore: () => {
					for (const [key, saved] of Object.entries(original)) {
						if (saved.value) node.style.setProperty(key, saved.value, saved.priority);
						else node.style.removeProperty(key);
					}
				}
			});
			controls.then(() => {
				if (!alive || exits.get(id)?.generation !== epoch) return;
				completed.set(id, epoch);
				if (!removalFrame) removalFrame = requestAnimationFrame(removeCompleted);
			});
		}
	}
	const scheduler = scheduleLatest(commit);
	$effect(() => {
		scheduler.value = requested;
	});
	export function mutate(workload: string) {
		requested = change(requested, workload);
	}
	export function request(next: typeof requested) {
		requested = next;
	}
	export function expected() {
		return [...requested.items];
	}
	export function stats() {
		return { ...layout.stats(), ...counters, exiting: exits.size };
	}
	export function enableDiagnostics() {
		diagnostic = true;
	}
	export function events() {
		return trace;
	}
	onDestroy(() => {
		alive = false;
		scheduler.dispose();
		cancelAnimationFrame(removalFrame);
		for (const exit of exits.values()) {
			exit.cancel();
			exit.restore();
		}
		exits.clear();
	});
</script>

<div
	class="grid"
	style:grid-template-columns={`repeat(${unstaged ? requested.columns : committed.columns},minmax(0,1fr))`}
>
	{#each entries as entry (entry.token)}
		<div
			class="cell"
			data-cell={entry.value}
			{@attach register(entry.value)}
			{@attach layout({ mode: 'position' })}
		>
			{entry.value}
		</div>
	{/each}
</div>
