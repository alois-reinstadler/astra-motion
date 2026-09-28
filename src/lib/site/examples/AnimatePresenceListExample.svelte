<script lang="ts">
	import { AnimatePresence, createLayout, motion } from '$lib/motion/index.js';
	const initial = [
		{ id: 'read', label: 'Read something new' },
		{ id: 'walk', label: 'Take the long way home' },
		{ id: 'write', label: 'Write one good sentence' }
	];
	let items = $state(initial);
	const layout = createLayout();
</script>

<div class="example">
	<button class="reset" onclick={() => (items = initial)}>Restore list</button>
	<ul>
		<AnimatePresence {items} key={(item) => item.id} mode="popLayout" initial={false}>
			{#snippet children(item)}
				<motion.li
					reducedMotion="user"
					layout
					layoutGroup={layout}
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: 28 }}
					transition={{ duration: 0.25 }}
				>
					<span>{item.label}</span>
					<button
						aria-label={`Remove ${item.label}`}
						onclick={() => (items = items.filter((entry) => entry.id !== item.id))}>Remove</button
					>
				</motion.li>
			{/snippet}
		</AnimatePresence>
	</ul>
</div>

<style>
	.example {
		display: grid;
		justify-items: center;
		gap: 20px;
		width: 100%;
		padding: 28px 16px;
		color: var(--site-ink, #252821);
	}
	ul {
		position: relative;
		display: grid;
		gap: 9px;
		width: min(100%, 350px);
		min-height: 180px;
		margin: 0;
		padding: 0;
		list-style: none;
		align-content: start;
	}
	ul :global(li) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
		padding: 18px;
		border: 1px solid var(--site-line, #d8d8cc);
		border-radius: 4px;
		background: var(--site-paper, #fffdf7);
		font-size: 12px;
	}
	button {
		border: 0;
		padding: 2px;
		color: var(--site-accent, #d34123);
		background: transparent;
		font: inherit;
		font-size: 11px;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--site-accent, #d34123);
		outline-offset: 4px;
	}
	.reset {
		border-bottom: 1px solid var(--site-line, #d8d8cc);
		padding-bottom: 6px;
		color: inherit;
	}
</style>
