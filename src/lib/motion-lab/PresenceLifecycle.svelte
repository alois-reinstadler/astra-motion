<script lang="ts">
	import { untrack } from 'svelte';
	import Presence from '../motion/Presence.svelte';
	import { presence } from '../motion/presence.js';
	let {
		mode = 'wait',
		onExitComplete,
		empty = false,
		duration = 180
	}: {
		mode?: 'wait' | 'sync';
		onExitComplete?: () => void;
		empty?: boolean;
		duration?: number;
	} = $props();
	let selected = $state.raw<{ value: string | number }>({ value: 'a' });
	let currentMode = $state(untrack(() => mode));
	let showing = $state(true);
	let callback = $state.raw(untrack(() => onExitComplete));
	export function select(value: string | number) {
		selected = { value };
	}
	export function changeMode(value: 'wait' | 'sync') {
		currentMode = value;
	}
	export function hide() {
		showing = false;
	}
	export function replaceCallback(value: () => void) {
		callback = value;
	}
</script>

{#if showing}
	<Presence value={selected.value} mode={currentMode} onExitComplete={callback}>
		{#snippet children(value)}
			{#if !empty || value !== 'a'}
				<div data-lifecycle={value} transition:presence|global={{ duration: 30 }}>
					<span transition:presence|global={{ duration }}>{value}</span>
				</div>
			{/if}
		{/snippet}
	</Presence>
{/if}
