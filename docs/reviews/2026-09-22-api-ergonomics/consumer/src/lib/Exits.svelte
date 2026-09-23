<script lang="ts">
	import { Motion, MotionConfig, Presence, presence, createLayout, popLayout } from 'astra-motion';
	import { createAttachmentKey } from 'svelte/attachments';
	let open = $state(true);
	let reduce = $state(false);
	let items = $state([1, 2, 3]);
	let chapter = $state(1);
	const group = createLayout();
	const popKey = createAttachmentKey();
</script>

<section>
	<h2>Exits and list</h2>
	<button id="toggle" onclick={() => (open = !open)}>Toggle exits</button>
	<button id="reduce" onclick={() => (reduce = !reduce)}>Reduce motion</button>
	<MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
		{#if open}<Motion
				id="exit"
				motion={{
					initial: false,
					animate: { opacity: 1, x: 0 },
					exit: { opacity: 0, x: 60 },
					transition: { duration: 1 }
				}}>Retained Motion exit</Motion
			>{/if}
		{#if open}<div id="fade" transition:presence={{ duration: 1000 }}>Standalone fade</div>{/if}
	</MotionConfig>
	<button id="remove" onclick={() => (items = items.filter((x) => x !== 2))}>Remove 2</button>
	<button id="undo" onclick={() => (items = [3, 2, 1])}>Undo and reorder</button>
	<button id="add" onclick={() => (items = [...items, Math.max(...items) + 1])}>Add</button>
	<ul style="position:relative">
		{#each items as item (item)}<Motion
				as="li"
				id={`item-${item}`}
				{...{ [popKey]: popLayout() }}
				motion={{
					layout: true,
					layoutGroup: group,
					initial: { opacity: 0 },
					animate: { opacity: 1 },
					exit: { opacity: 0 },
					transition: { duration: 0.4 }
				}}>{item}</Motion
			>{/each}
	</ul>
	<button id="next" onclick={() => chapter++}>Next chapter</button>
	<Presence value={chapter}
		>{#snippet children(value)}<p id="chapter" transition:presence={{ duration: 150 }}>
				Chapter {value}
			</p>{/snippet}</Presence
	>
</section>
