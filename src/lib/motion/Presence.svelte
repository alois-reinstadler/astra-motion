<script lang="ts" generics="T">
	import { onDestroy, untrack, type Snippet } from 'svelte';
	import PresenceBranch from './PresenceBranch.svelte';
	let {
		value,
		mode = 'wait',
		onExitComplete,
		children
	}: {
		value: T;
		mode?: 'wait' | 'sync';
		onExitComplete?: () => void;
		children: Snippet<[T]>;
	} = $props();
	let current = $state.raw(untrack(() => value));
	let previousMode = untrack(() => mode);
	let alive = true;
	let generation = 0;
	const negativeZeroKey = Symbol();
	const visible = $derived(Object.is(value, current));
	// This lifecycle registry is never consumed by a reactive effect.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const branches = new Map<symbol, T>();
	let syncCompletionQueued: number | undefined;

	$effect.pre(() => {
		if (mode !== previousMode) {
			previousMode = mode;
			generation++;
			branches.clear();
			current = untrack(() => value);
		}
	});

	// Branch destruction follows the whole native outro group, including nested
	// transitions. Reversing an exit retains the branch and never completes it.
	function registerWait() {
		const registeredGeneration = generation;
		return () => {
			queueMicrotask(() => {
				if (!alive || mode !== 'wait' || generation !== registeredGeneration) return;
				onExitComplete?.();
				// A callback may choose another destination or dispose this component.
				if (alive) current = value;
			});
		};
	}

	function registerSync(branchValue: T) {
		const registeredGeneration = generation;
		const token = Symbol();
		branches.set(token, branchValue);
		return () => {
			branches.delete(token);
			if (generation !== registeredGeneration || syncCompletionQueued === generation) return;
			syncCompletionQueued = generation;
			queueMicrotask(() => {
				if (syncCompletionQueued === registeredGeneration) syncCompletionQueued = undefined;
				if (!alive || mode !== 'sync' || generation !== registeredGeneration) return;
				// Only notify once the last outgoing branch has left. A restored
				// keyed branch is current again, so its cancelled exit does not wait.
				if ([...branches.values()].every((entry) => Object.is(entry, value))) {
					onExitComplete?.();
				}
			});
		};
	}

	onDestroy(() => {
		alive = false;
	});
</script>

{#key mode}
	{#if mode === 'sync'}
		{#each [value] as entry (Object.is(entry, -0) ? negativeZeroKey : entry)}
			<PresenceBranch value={entry} register={registerSync} {children} />
		{/each}
	{:else if visible}
		<PresenceBranch value={current} register={registerWait} {children} />
	{/if}
{/key}
