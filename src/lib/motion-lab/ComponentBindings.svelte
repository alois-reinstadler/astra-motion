<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { createMotion } from '$lib/motion/motion.svelte.js';

	const card = createMotion({
		initial: { opacity: 0.2, y: 16 },
		animate: { opacity: 1, y: 0 }
	});
	const content = createMotion({
		initial: { opacity: 0.3, y: -4 },
		animate: { opacity: 1, y: 0 }
	});
</script>

<Card.Root data-testid="plain-card" style="color:red">Plain card</Card.Root>
<Card.Root data-testid="bound-card" motion={card} style="color:red">Animated card</Card.Root>
<Accordion.Root type="single" value="open">
	<Accordion.Item value="open">
		<Accordion.Trigger>Open content</Accordion.Trigger>
		<Accordion.Content motion={content}>Animated content</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
