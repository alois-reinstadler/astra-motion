<script lang="ts">
	let { category, id }: { category: string; id: string } = $props();
	const kind = $derived(
		id === 'variants'
			? 'stagger'
			: category === 'Layout & presence'
				? 'layout'
				: category === 'Scroll'
					? 'scroll'
					: category === 'Values'
						? 'values'
						: category === 'Gestures'
							? 'gesture'
							: 'target'
	);
</script>

<div
	class="hint"
	class:stagger={kind === 'stagger'}
	class:layout={kind === 'layout'}
	class:scroll={kind === 'scroll'}
	class:values={kind === 'values'}
	class:gesture={kind === 'gesture'}
	aria-hidden="true"
>
	<span class="destination"></span>
	<span class="piece one"></span><span class="piece two"></span><span class="piece three"></span>
</div>

<style>
	.hint {
		height: 124px;
		width: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		overflow: hidden;
		color: var(--site-accent);
	}
	.piece {
		width: 42px;
		height: 42px;
		border-radius: 8px;
		background: currentColor;
		display: block;
		transition:
			transform 600ms cubic-bezier(0.16, 1, 0.3, 1),
			opacity 300ms;
	}
	.two,
	.three {
		display: none;
	}
	.destination {
		position: absolute;
		width: 42px;
		height: 42px;
		border: 1px dashed currentColor;
		border-radius: 8px;
		transform: translateX(48px);
		opacity: 0.5;
	}
	.one {
		transform: translateX(-48px);
	}
	:global(.example:is(:hover, :focus-visible)) .one {
		transform: translateX(48px) rotate(90deg);
	}
	.stagger .two,
	.stagger .three,
	.layout .two,
	.layout .three {
		display: block;
	}
	.stagger .destination,
	.layout .destination,
	.gesture .destination,
	.scroll .destination,
	.values .destination {
		display: none;
	}
	.stagger .piece {
		width: 70px;
		height: 12px;
		transform: translateX(-20px);
		opacity: 0.45;
	}
	.stagger {
		flex-direction: column;
	}
	.stagger .two {
		transition-delay: 100ms;
	}
	.stagger .three {
		transition-delay: 200ms;
	}
	:global(.example:is(:hover, :focus-visible)) .stagger .piece {
		transform: translateX(0);
		opacity: 1;
	}
	.layout .piece {
		width: 32px;
		height: 48px;
		transform: none;
	}
	.layout .two {
		opacity: 0.55;
	}
	.layout .three {
		opacity: 0.3;
	}
	:global(.example:is(:hover, :focus-visible)) .layout .one {
		transform: scaleX(1.5);
	}
	:global(.example:is(:hover, :focus-visible)) .layout .two,
	:global(.example:is(:hover, :focus-visible)) .layout .three {
		transform: translateX(12px);
	}
	.gesture .one {
		transform: none;
		width: 100px;
		height: 36px;
		border-radius: 24px;
	}
	:global(.example:is(:hover, :focus-visible)) .gesture .one {
		transform: scale(1.1) translateY(-5px);
	}
	.scroll .one {
		width: 160px;
		height: 5px;
		transform: scaleX(0.2);
		transform-origin: left;
	}
	:global(.example:is(:hover, :focus-visible)) .scroll .one {
		transform: scaleX(1);
	}
	.values .one {
		border-radius: 50%;
	}
	:global(.example:is(:hover, :focus-visible)) .values .one {
		transform: translateX(48px) scale(1.3);
	}
	@media (prefers-reduced-motion: reduce) {
		.piece {
			transition: none;
		}
	}
</style>
