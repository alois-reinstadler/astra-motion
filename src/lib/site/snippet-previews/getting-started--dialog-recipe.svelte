<script lang="ts">
	import { useAnimate } from '$lib/motion/index.js';
	const [scope, animate] = useAnimate<HTMLDialogElement>();
	const titleId = $props.id();
	let closing = $state(false);
	function open() {
		scope.current?.showModal();
	}
	async function close() {
		const dialog = scope.current;
		if (!dialog || closing) return;
		closing = true;
		const result = await animate(dialog, { opacity: [1, 0] }, { duration: 0.15 }).settled;
		if (result.status === 'finished' && dialog.isConnected) dialog.close();
		dialog.style.removeProperty('opacity');
		closing = false;
	}
</script>

<div class="snippet-stage">
	<button onclick={open}>Edit profile</button>
	<dialog
		{@attach scope.attach}
		aria-labelledby={titleId}
		oncancel={(event) => {
			event.preventDefault();
			void close();
		}}
	>
		<h2 id={titleId}>Edit profile</h2>
		<label>Name <input /></label>
		<button onclick={close} disabled={closing}>Close</button>
	</dialog>
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

	dialog {
		max-width: min(360px, calc(100vw - 48px));
		padding: 24px;
		border: 1px solid #bfc8ae;
		border-radius: 12px;
		color: #252821;
		background: #f7f7f0;
	}
	dialog::backdrop {
		background: #25282180;
	}
	dialog label {
		display: grid;
		gap: 8px;
		margin: 16px 0;
	}
	dialog input {
		font: inherit;
		padding: 8px;
		max-width: 100%;
	}
</style>
