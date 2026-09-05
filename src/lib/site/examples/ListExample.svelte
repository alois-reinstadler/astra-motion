<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { Motion, createLayout, popLayout } from '$lib/motion/index.js';
	const tasks = [
		{ id: 1, title: 'Collect a little inspiration', category: 'Explore' },
		{ id: 2, title: 'Try something unexpected', category: 'Create' },
		{ id: 3, title: 'Leave room for a walk', category: 'Unwind' }
	];
	let remaining = $state(tasks);
	const layout = createLayout({ transition: { type: 'spring', stiffness: 340, damping: 30 } });
	const pop = { [createAttachmentKey()]: popLayout() };
</script>

<div class="list-example">
	<div class="heading"><span>A GOOD DAY</span><span>{remaining.length} to enjoy</span></div>
	<ul aria-label="Today's little plans">
		{#each remaining as task (task.id)}
			<Motion
				as="li"
				class="task"
				{...pop}
				motion={{
					initial: { opacity: 0, y: 8 },
					animate: { opacity: 1, y: 0 },
					exit: { opacity: 0, x: 32, scale: 0.96 },
					layout: { mode: 'position' },
					layoutGroup: layout,
					transition: { duration: 0.25 }
				}}
			>
				<button
					type="button"
					class="complete"
					aria-label={`Complete: ${task.title}`}
					onclick={() => (remaining = remaining.filter((item) => item.id !== task.id))}
					><span aria-hidden="true">✓</span></button
				>
				<div>
					<h3>{task.title}</h3>
					<p>{task.category}</p>
				</div>
			</Motion>
		{/each}
		{#if remaining.length === 0}<li class="empty">
				A day well spent. <span aria-hidden="true">✳</span>
			</li>{/if}
	</ul>
	<button
		type="button"
		class="restore"
		onclick={() => (remaining = tasks)}
		disabled={remaining.length === tasks.length}
		>Start again <span aria-hidden="true">↺</span></button
	>
</div>

<style>
	.list-example {
		width: 100%;
		max-width: 420px;
		margin: auto;
		color: #252821;
	}
	.heading {
		display: flex;
		justify-content: space-between;
		margin-bottom: 17px;
		font-size: 9px;
		letter-spacing: 0.13em;
		color: #85897b;
	}
	.heading > span + span {
		letter-spacing: 0;
		font-size: 11px;
	}
	ul {
		position: relative;
		min-height: 206px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.list-example :global(.task) {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 62px;
		padding: 10px 13px;
		box-sizing: border-box;
		border: 1px solid #ddded3;
		border-radius: 10px;
		background: #fffdf7;
	}
	.complete {
		display: grid;
		place-items: center;
		width: 25px;
		height: 25px;
		flex: none;
		padding: 0;
		border: 1px solid #cdd2c2;
		border-radius: 50%;
		color: transparent;
		background: #f7f7ef;
		cursor: pointer;
	}
	.complete:hover {
		color: #536a3b;
		border-color: #899b73;
		background: #dfe5d1;
	}
	h3 {
		margin: 0;
		font-size: 12px;
		font-weight: 500;
	}
	p {
		margin: 3px 0 0;
		color: #929686;
		font-size: 10px;
	}
	.empty {
		min-height: 206px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 13px;
		font-size: 16px;
		color: #767e69;
	}
	.empty > span {
		font-size: 40px;
		color: #d34123;
	}
	.restore {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 16px;
		padding: 12px 16px;
		border: 1px solid #d5d5ca;
		border-radius: 8px;
		background: #fffdf7;
		color: #252821;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	.restore > span {
		font-size: 18px;
		line-height: 1;
	}
	.restore:disabled {
		color: #a3a699;
		cursor: default;
	}
	.restore:hover:not(:disabled) {
		border-color: #858c79;
	}
	button:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 3px;
	}
</style>
