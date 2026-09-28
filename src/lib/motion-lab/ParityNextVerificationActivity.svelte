<script lang="ts">
	import { AnimateActivity } from '../motion/index.js';
	import Tab from './ParityNextVerificationTab.svelte';
	let {
		nested = false,
		wrapped = false,
		layoutMode = 'preserve',
		onLifecycle,
		onExitComplete
	}: {
		nested?: boolean;
		wrapped?: boolean;
		layoutMode?: 'preserve' | 'pop';
		onLifecycle?: (event: string, time: number) => void;
		onExitComplete?: () => void;
	} = $props();
	let mode = $state<'visible' | 'hidden'>('visible');
	let innerMode = $state<'visible' | 'hidden'>('visible');
	export function hide() {
		mode = 'hidden';
	}
	export function show() {
		mode = 'visible';
	}
	export function hideInner() {
		innerMode = 'hidden';
	}
	export function showInner() {
		innerMode = 'visible';
	}
</script>

<div style="position: relative; width: 240px;" data-verification-container>
	<AnimateActivity {mode} {layoutMode} initial={false} {onExitComplete} data-verification-outer>
		{#if nested}
			<AnimateActivity mode={innerMode} {layoutMode} initial={false} data-verification-inner>
				<Tab {onLifecycle} />
			</AnimateActivity>
			<AnimateActivity mode="hidden" initial={false} data-verification-locally-hidden>
				<Tab id="locally-hidden" {onLifecycle} />
			</AnimateActivity>
		{:else if wrapped}
			<div data-verification-wrapper style="padding: 12px; border: 2px solid black;">
				<Tab {onLifecycle} />
			</div>
		{:else}
			<Tab {onLifecycle} />
		{/if}
	</AnimateActivity>
	<div data-verification-sibling style="height: 20px;">Sibling</div>
	<button data-verification-outside>Outside focus target</button>
</div>
