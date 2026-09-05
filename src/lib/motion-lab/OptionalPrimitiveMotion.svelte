<script lang="ts">
	import * as Dialog from '../components/ui/dialog/index.js';
	import * as Accordion from '../components/ui/accordion/index.js';
	import { createMotion } from '../motion/lite.svelte.js';
	let enabled = $state(false);
	const dialog = createMotion({ initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } });
	const accordion = createMotion({ initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } });
	export function setMotion(value: boolean) {
		enabled = value;
	}
</script>

<Dialog.Root>
	<Dialog.Trigger>Open editable dialog</Dialog.Trigger>
	<Dialog.Content motion={enabled ? dialog : undefined}>
		<Dialog.Title>Editable details</Dialog.Title>
		<Dialog.Description>Keep the native draft when motion changes.</Dialog.Description>
		<input aria-label="Dialog draft" value="Original" />
	</Dialog.Content>
</Dialog.Root>
<Accordion.Root type="single" value="details">
	<Accordion.Item value="details">
		<Accordion.Trigger>Editable inspector</Accordion.Trigger>
		<Accordion.Content motion={enabled ? accordion : undefined}>
			<input aria-label="Accordion draft" value="Original" />
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
