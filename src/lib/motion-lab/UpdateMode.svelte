<script lang="ts">
	import { untrack } from 'svelte';
	import { createLayout } from '../motion/index.js';
	let { automatic = true }: { automatic?: boolean } = $props();
	const layout = createLayout({
		automatic: untrack(() => automatic),
		transition: { duration: 0.75, ease: 'linear' }
	});
	let moved = $state(false);
	export function ordinary() {
		moved = !moved;
	}
	export function transaction() {
		layout.update(() => {
			moved = !moved;
		});
	}
	export function stats() {
		return layout.stats();
	}
</script>

<div class="controls">
	<button onclick={ordinary} data-testid="ordinary-update">Ordinary assignment</button>
	<button onclick={transaction} data-testid="explicit-update">Explicit transaction</button>
</div>
<div class="stage" class:moved>
	<div
		class="surface"
		data-testid="update-surface"
		{@attach layout({ style: { borderRadius: 18 } })}
	>
		<div class="label" {@attach layout({ mode: 'position' })}>
			<small>NORMAL CSS</small>
			<strong>Space<br />to move.</strong>
		</div>
	</div>
</div>
<div class="code-pair">
	<div>
		<span>ORDINARY ASSIGNMENT</span>
		<pre><code>moved = !moved;</code></pre>
	</div>
	<div>
		<span>EXPLICIT TRANSACTION</span>
		<pre><code>{'layout.update(() => {\n  moved = !moved;\n});'}</code></pre>
	</div>
</div>
<p class="result" aria-live="polite">
	{automatic
		? 'Both buttons animate. Automatic observation uses the last committed geometry; the explicit transaction captures geometry immediately before its callback.'
		: 'Ordinary assignment jumps directly to the CSS destination. The explicit transaction captures the old geometry, commits the assignment and animates the change.'}
</p>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 24px;
	}
	button {
		border: 1px solid #353c2d;
		border-radius: 100px;
		padding: 12px 19px;
		background: transparent;
		color: #353c2d;
		font: inherit;
		cursor: pointer;
	}
	button:hover {
		background: #353c2d;
		color: #f4f2eb;
	}
	button:focus-visible {
		outline: 3px solid #ce5938;
		outline-offset: 4px;
	}
	.stage {
		position: relative;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		width: 100%;
		max-width: 620px;
		height: 240px;
		background: #e9e7de;
		border-radius: 24px;
		padding: 24px;
		box-sizing: border-box;
	}
	.stage.moved {
		justify-content: flex-end;
	}
	.surface {
		width: 120px;
		height: 136px;
		flex: none;
		padding: 20px;
		box-sizing: border-box;
		background: #ce5938;
		color: #fff7ee;
	}
	.moved .surface {
		width: 220px;
		height: 176px;
	}
	.label {
		width: 80px;
	}
	small {
		display: block;
		font-size: 9px;
		letter-spacing: 0.08em;
		margin-bottom: 10px;
	}
	strong {
		display: block;
		font:
			24px/1.05 Georgia,
			serif;
		font-weight: 400;
	}
	.code-pair {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 24px;
		margin-top: 30px;
	}
	.code-pair span {
		font-size: 10px;
		letter-spacing: 0.1em;
	}
	pre {
		overflow-x: auto;
		font-size: 13px;
		line-height: 1.6;
	}
	.result {
		max-width: 620px;
		line-height: 1.6;
		font-size: 14px;
	}
	@media (max-width: 480px) {
		.code-pair {
			grid-template-columns: 1fr;
			gap: 8px;
		}
	}
</style>
