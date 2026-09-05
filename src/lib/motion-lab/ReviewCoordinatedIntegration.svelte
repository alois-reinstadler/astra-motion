<script lang="ts">
	import Presence from '../motion/Presence.svelte';
	import { createLayout } from '../motion/layout.js';
	import Branch from './ReviewCoordinatedBranch.svelte';
	const layout = createLayout();
	let selected = $state('a');
	let alive = $state(true);
	export function select(value: string) {
		selected = value;
	}
	export function destroy() {
		alive = false;
	}
	export function participants() {
		return layout.stats().participants;
	}
</script>

{#if alive}
	<div style="position:relative;display:flex">
		<Presence value={selected}>
			{#snippet children(value)}<Branch {value} {layout} />{/snippet}
		</Presence>
		<div data-review-survivor {@attach layout()} style="width:30px;height:30px">Sibling</div>
	</div>
{/if}
