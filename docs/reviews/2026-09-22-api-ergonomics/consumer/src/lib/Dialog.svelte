<script lang="ts">
	import { Dialog, mergeProps } from 'bits-ui';
	import { createMotion } from 'astra-motion';
	const panel = createMotion({
		initial: { opacity: 0, y: 8 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: 8 },
		transition: { duration: 0.3 }
	});
	const exit = panel.transition;
</script>

<section>
	<h2>Headless dialog</h2>
	<Dialog.Root
		><Dialog.Trigger id="dialog-open">Open dialog</Dialog.Trigger><Dialog.Portal
			><Dialog.Content id="dialog" forceMount
				>{#snippet child({ props, open })}{#if open}<div
							{...mergeProps(props, panel.props)}
							style="position:fixed;inset:0;margin:auto;width:300px;height:180px;background:white;border:1px solid;z-index:20"
							transition:exit
						>
							<Dialog.Title>Review dialog</Dialog.Title><Dialog.Description
								>Focus and exit check</Dialog.Description
							><label>Text <input /></label><Dialog.Close id="dialog-close">Close</Dialog.Close>
						</div>{/if}{/snippet}</Dialog.Content
			></Dialog.Portal
		></Dialog.Root
	>
</section>
