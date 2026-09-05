<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createMotion } from '$lib/motion/motion.svelte.js';
	import { popLayout } from '$lib/motion/presence.js';
	import type { LayoutController } from '$lib/motion/layout.js';

	let {
		id,
		name,
		category,
		layout,
		onremove
	}: {
		id: number;
		name: string;
		category: string;
		layout: LayoutController;
		onremove: () => void;
	} = $props();
	const motion = createMotion(() => ({
		initial: { opacity: 0, scale: 0.96 },
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.96 },
		layout: true,
		layoutGroup: layout,
		transition: { duration: 0.24 }
	}));
	const pop = { [createAttachmentKey()]: popLayout() };
	const positionKey = createAttachmentKey();
	const position = $derived({ [positionKey]: layout({ mode: 'position' }) });
</script>

<Card.Root data-testid={`component-card-${id}`} {...pop} {motion}>
	<Card.Header {...position}>
		<Card.Title><span class="block" {@attach layout({ mode: 'position' })}>{name}</span></Card.Title
		>
		<Card.Description>{category}</Card.Description>
	</Card.Header>
	<Card.Content {...position}>
		<p class="block" {@attach layout({ mode: 'position' })}>
			Filter, reorder or remove this card while its entrance is still running.
		</p>
	</Card.Content>
	<Card.Footer {...position}>
		<Button variant="outline" onclick={onremove} aria-label={`Remove ${name}`}>Remove</Button>
	</Card.Footer>
</Card.Root>
