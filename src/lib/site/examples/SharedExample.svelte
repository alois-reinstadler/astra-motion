<script lang="ts">
	import { motion, createLayout } from '$lib/motion/index.js';
	const moods = [
		{
			name: 'Focus',
			title: 'Find your flow.',
			detail: 'A quiet space for your next good idea.',
			color: '#dfe5d1'
		},
		{
			name: 'Create',
			title: 'Make a little magic.',
			detail: 'Follow the idea. See where it goes.',
			color: '#f2d5ba'
		},
		{
			name: 'Rest',
			title: 'Take the long way.',
			detail: 'A pause is part of the process.',
			color: '#dce4e9'
		}
	];
	let selected = $state(0);
	const layout = createLayout({ transition: { type: 'spring', stiffness: 360, damping: 30 } });
</script>

<div class="shared-example">
	<div class="mood" aria-live="polite">
		<motion.div
			class="orb"
			motion={{
				animate: { backgroundColor: moods[selected].color, rotate: selected * 90 },
				transition: { duration: 0.4 }
			}}
		>
			<span class="orbit"></span><span class="orbit"></span>
		</motion.div>
		<h3>{moods[selected].title}</h3>
		<p>{moods[selected].detail}</p>
	</div>
	<div class="choices" role="group" aria-label="Choose a mood">
		{#each moods as mood, index (mood.name)}
			<button type="button" aria-pressed={selected === index} onclick={() => (selected = index)}>
				{#if selected === index}
					<motion.div
						class="selected"
						motion={{ layout: { id: 'mood-selection' }, layoutGroup: layout }}
					/>
				{/if}
				<span>{mood.name}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.shared-example {
		width: 100%;
		max-width: 420px;
		margin: auto;
		color: #252821;
	}
	.mood {
		min-height: 226px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.shared-example :global(.orb) {
		width: 78px;
		height: 78px;
		position: relative;
		border-radius: 50%;
		overflow: hidden;
	}
	.orbit {
		position: absolute;
		width: 78px;
		height: 78px;
		border: 1px solid #2528214d;
		border-radius: 50%;
		top: 0;
		left: -39px;
	}
	.orbit + .orbit {
		left: 39px;
	}
	h3 {
		margin: 18px 0 6px;
		font-size: 22px;
		font-weight: 500;
		letter-spacing: -0.05em;
	}
	p {
		margin: 0;
		color: #62695a;
		font-size: 12px;
	}
	.choices {
		display: flex;
		gap: 4px;
		padding: 5px;
		background: #e8e8df;
		border: 1px solid #ddded3;
		border-radius: 12px;
	}
	button {
		position: relative;
		flex: 1;
		padding: 11px 6px;
		border: 0;
		border-radius: 8px;
		color: #58614f;
		background: transparent;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		color: #252821;
	}
	button > span {
		position: relative;
		z-index: 1;
	}
	.shared-example :global(.selected) {
		position: absolute;
		inset: 0;
		border-radius: 8px;
		background: #fffdf7;
		box-shadow: 0 2px 5px #2528210c;
	}
	button:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 3px;
	}
</style>
