<script lang="ts">
	import { LayoutGroup, motion } from '$lib/motion/index.js';
</script>

<div class="demo">
	<LayoutGroup id="field-notes">
		<motion.details layout class="panel">
			<summary>What should move?</summary>
			<p>Let layout connect the size and position changes that your CSS already describes.</p>
		</motion.details>
		<motion.details layout class="panel">
			<summary>What stays native?</summary>
			<p>
				These details elements keep their own open state, keyboard behavior, and semantics. The
				sibling moves when either one expands.
			</p>
		</motion.details>
	</LayoutGroup>
	<p class="hint">Open each panel independently. The group adds no wrapper element.</p>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 340px;
		margin: auto;
		color: #252821;
	}
	.demo :global(.panel) {
		margin-bottom: 10px;
		border: 1px solid #ddded3;
		border-radius: 8px;
		background: #fffdf7;
		overflow: hidden;
	}
	summary {
		padding: 17px;
		font-size: 13px;
		cursor: pointer;
	}
	summary:focus-visible {
		outline: 2px solid #bc3c21;
		outline-offset: -4px;
	}
	p {
		margin: 0;
		padding: 0 17px 18px;
		color: #62695a;
		font-size: 12px;
		line-height: 1.6;
	}
	.hint {
		margin-top: 15px;
		padding: 0;
		font-size: 11px;
		text-align: center;
	}
</style>
