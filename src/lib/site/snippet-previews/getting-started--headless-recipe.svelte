<script lang="ts">
	import { Dialog, mergeProps } from 'bits-ui';
	import { motion } from '$lib/motion/index.js';
	const panel = motion.bind({
		initial: { opacity: 0, scale: 0.96 },
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.96 },
		transition: { duration: 0.15 },
		reducedMotion: 'user'
	});
	const enterExit = panel.transition;
</script>

<div class="snippet-stage">
	<Dialog.Root>
		<Dialog.Trigger>Open settings</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Content forceMount>
				{#snippet child({ props, open })}
					{#if open}
						<div {...mergeProps(props, panel.props)} class="panel" transition:enterExit|global>
							<Dialog.Title>Settings</Dialog.Title>
							<Dialog.Description
								>Motion preserves this dialog’s interaction contract.</Dialog.Description
							>
							<label>Name <input /></label>
							<Dialog.Close>Close</Dialog.Close>
						</div>
					{/if}
				{/snippet}
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
</div>

<style>
	.snippet-stage {
		display: grid;
		justify-items: start;
		gap: 16px;
		width: min(100%, 360px);
		min-height: 180px;
		margin: auto;
		color: #252821;
		font-size: 14px;
		line-height: 1.6;
	}
	.snippet-stage :global(button) {
		font: inherit;
		color: inherit;
		padding: 10px 16px;
		border: 1px solid #bfc8ae;
		border-radius: 8px;
		background: #f7f7f0;
		cursor: pointer;
	}
	.snippet-stage :global(button:disabled) {
		opacity: 0.5;
		cursor: default;
	}
	.snippet-stage :global(:focus-visible) {
		outline: 2px solid #bc3c21;
		outline-offset: 4px;
	}

	.panel {
		position: fixed;
		inset: 0;
		margin: auto;
		width: min(90vw, 320px);
		height: fit-content;
		padding: 24px;
		background: white;
		color: black;
	}

	.panel {
		z-index: 100;
		border: 1px solid #bfc8ae;
		border-radius: 12px;
		box-shadow: 0 16px 64px #25282140;
	}
	.panel label {
		display: grid;
		gap: 8px;
		margin: 16px 0;
	}
	.panel input {
		font: inherit;
		padding: 8px;
		max-width: 100%;
	}
	.panel :global(button) {
		font: inherit;
		padding: 10px 16px;
		border: 1px solid #bfc8ae;
		border-radius: 8px;
		background: #f7f7f0;
		cursor: pointer;
	}
</style>
