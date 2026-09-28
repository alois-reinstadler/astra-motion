<script lang="ts">
	import { useInView } from '$lib/motion/index.js';
	let container = $state<HTMLDivElement>();
	let target = $state<HTMLDivElement>();
	function attachContainer(node: HTMLDivElement) {
		container = node;
		return () => {
			container = undefined;
		};
	}
	function attachTarget(node: HTMLDivElement) {
		target = node;
		return () => {
			target = undefined;
		};
	}
	let once = $state(false);
	const visible = useInView(
		() => target,
		() => ({ root: () => container, amount: 0.75, once })
	);
</script>

<div class="example">
	<div class="controls">
		<button onclick={() => container?.scrollTo(0, 220)}>Find target</button><button
			onclick={() => container?.scrollTo(0, 0)}>Back to top</button
		><label><input type="checkbox" bind:checked={once} /> Once</label>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The scroll region needs focus for native keyboard scrolling.) -->
	<div
		class="viewport"
		{@attach attachContainer}
		tabindex="0"
		role="region"
		aria-label="Visibility example"
	>
		<p class="space">The target starts below this view.</p>
		<div class="target" class:visible={visible.current} {@attach attachTarget}>
			75% visible to enter
		</div>
		<div class="after"></div>
	</div>
	<output aria-live="polite">{visible.current ? 'Inside' : 'Outside'}</output>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 18px;
		width: 100%;
		padding: 24px 18px;
		color: var(--site-ink, #252821);
	}
	.controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
	}
	button {
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 22px;
		padding: 8px 12px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	label {
		font-size: 11px;
	}
	input {
		accent-color: #d34123;
	}
	button:focus-visible,
	.viewport:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.viewport {
		width: min(100%, 290px);
		height: 180px;
		overflow: auto;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 4px;
	}
	.space {
		height: 220px;
		margin: 0;
		padding: 22px;
		font-size: 12px;
	}
	.target {
		height: 110px;
		margin: 0 16px;
		display: grid;
		place-items: center;
		background: #dfe5d1;
		font-size: 13px;
	}
	.target.visible {
		background: #edd1ba;
	}
	.after {
		height: 180px;
	}
	output {
		font-size: 12px;
		color: var(--site-muted, #67695e);
	}
</style>
