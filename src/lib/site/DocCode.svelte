<script lang="ts">
	import { onMount } from 'svelte';
	import CodeText from './CodeText.svelte';
	let { source, label = 'Example.svelte' }: { source: string; label?: string } = $props();
	let ready = $state(false);
	let pending = $state(false);
	let copiedSource = $state<string | null>(null);
	let failedSource = $state<string | null>(null);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;
	let alive = false;
	const copied = $derived(copiedSource === source);
	const failed = $derived(failedSource === source);
	const feedback = $derived(
		copied
			? 'Copied to clipboard'
			: failed
				? 'Select the source to copy it. Clipboard access is unavailable.'
				: ''
	);
	onMount(() => {
		ready = true;
		alive = true;
		return () => {
			alive = false;
			clearTimeout(resetTimer);
		};
	});
	async function copy() {
		if (pending) return;
		const text = source;
		pending = true;
		clearTimeout(resetTimer);
		copiedSource = null;
		failedSource = null;
		try {
			await navigator.clipboard.writeText(text);
			if (alive && source === text) {
				copiedSource = text;
				resetTimer = setTimeout(() => {
					copiedSource = null;
				}, 2400);
			}
		} catch {
			if (alive && source === text) failedSource = text;
		} finally {
			if (alive) pending = false;
		}
	}
</script>

<div class="code-block">
	<div class="code-header">
		<span class="code-filename">{label}</span>
		<button
			class:copied
			class:failed
			onclick={copy}
			disabled={!ready || pending}
			aria-label={`Copy ${label}`}
			aria-busy={pending}
		>
			<span class="copy-icon" aria-hidden="true">
				<svg class="sheets" viewBox="0 0 20 20" fill="none"
					><rect x="6" y="6" width="10" height="11" rx="2" /><path
						d="M12 6V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
					/></svg
				>
				<svg class="check" viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-8" /></svg>
			</span>
			<span class="copy-label" aria-hidden="true"
				><span class="idle-label">{pending ? 'Copying' : failed ? 'Retry' : 'Copy'}</span><span
					class="done-label">Copied</span
				></span
			>
		</button>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll complete source examples.) -->
	<pre tabindex="0" role="region" aria-label={`${label} source`}><CodeText {source} {label} /></pre>
	<p class="copy-feedback" class:copy-error={failed} class:sr-only={!failed} role="status">
		{feedback}
	</p>
</div>

<style>
	.code-block {
		margin: 24px 0;
		min-width: 0;
	}
	.code-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 10px 14px 10px 18px;
		border: 1px solid var(--site-line);
		border-bottom: 0;
		background: #e7e9df;
		border-radius: 7px 7px 0 0;
		font-size: 11px;
		color: #545b4b;
	}
	.code-filename {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		gap: 7px;
		min-width: 90px;
		min-height: 36px;
		border: 1px solid #bfc4b5;
		background: #f7f7f0;
		border-radius: 6px;
		padding: 7px 10px;
		cursor: pointer;
		font: inherit;
		color: #374031;
		transition:
			background-color 180ms,
			color 180ms,
			border-color 180ms,
			box-shadow 180ms,
			translate 180ms;
	}
	button:hover:not(:disabled):not(.copied):not(.failed) {
		border-color: #7d8970;
		background: #fffef8;
		box-shadow: 0 3px 8px #25282110;
		translate: 0 -1px;
	}
	button:active:not(:disabled) {
		translate: 0 1px;
		box-shadow: none;
	}
	button:disabled {
		cursor: default;
	}
	button.copied {
		background: #e1ecd6;
		border-color: #9ab187;
		color: #35522b;
	}
	button.failed {
		border-color: #c23d22;
		color: #a9331c;
	}
	.copy-icon {
		position: relative;
		width: 16px;
		height: 18px;
	}
	svg {
		position: absolute;
		inset: 0;
		width: 18px;
		height: 18px;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition:
			opacity 180ms,
			transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.check {
		opacity: 0;
		transform: scale(0.65);
	}
	.check path {
		stroke-dasharray: 22;
		stroke-dashoffset: 22;
		transition: stroke-dashoffset 320ms ease 60ms;
	}
	.copied .sheets {
		opacity: 0;
		transform: translateY(-4px) scale(0.8);
	}
	.copied .check {
		opacity: 1;
		transform: scale(1);
	}
	.copied .check path {
		stroke-dashoffset: 0;
	}
	.copy-label {
		display: grid;
		overflow: hidden;
	}
	.copy-label > span {
		grid-area: 1 / 1;
		transition:
			opacity 180ms,
			transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.done-label {
		opacity: 0;
		transform: translateY(100%);
	}
	.copied .idle-label {
		opacity: 0;
		transform: translateY(-100%);
	}
	.copied .done-label {
		opacity: 1;
		transform: translateY(0);
	}
	pre {
		max-width: 100%;
		overflow: auto;
		margin: 0;
		border: 1px solid var(--site-line);
		background: #fff;
		color: #24292e;
		border-radius: 0 0 7px 7px;
		padding: 23px 22px;
		font:
			12px/1.8 'SFMono-Regular',
			Consolas,
			'Liberation Mono',
			monospace;
		tab-size: 2;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
	.copy-error {
		color: #a9331c;
		font-size: 12px;
		line-height: 1.6;
		margin: 10px 0 0;
	}
	:focus-visible {
		outline: 2px solid var(--site-accent);
		outline-offset: 4px;
	}
	@media (prefers-reduced-motion: reduce) {
		button,
		svg,
		.check path,
		.copy-label > span {
			transition: none;
		}
		button:hover:not(:disabled),
		button:active:not(:disabled) {
			translate: none;
		}
	}
	@media (max-width: 600px) {
		pre {
			padding: 18px 14px;
			font-size: 11px;
		}
		.code-header {
			padding-inline: 14px;
		}
	}
</style>
