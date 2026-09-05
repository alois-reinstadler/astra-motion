<script lang="ts">
	import { Accordion, Dialog } from 'bits-ui';
	import { presence } from '$lib/motion/presence.js';

	let open = $state(false);
	let owner = $state(true);
	let closes = $state(0);
</script>

<button data-testid="bits-owner" onclick={() => (owner = !owner)}>Toggle owner</button>
<button data-testid="bits-reopen" onclick={() => (open = true)}>Reopen</button>
<output data-testid="bits-closes">{closes}</output>
{#if owner}
	<Dialog.Root bind:open>
		<Dialog.Trigger data-testid="bits-trigger">Open dialog</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay forceMount>
				{#snippet child({ props, open })}
					{#if open}
						<div
							{...props}
							data-testid="bits-overlay"
							transition:presence={{ duration: 240 }}
						></div>
					{/if}
				{/snippet}
			</Dialog.Overlay>
			<Dialog.Content forceMount onCloseAutoFocus={() => closes++}>
				{#snippet child({ props, open })}
					{#if open}
						<div {...props} data-testid="bits-content" transition:presence={{ duration: 240 }}>
							<Dialog.Title>Lifecycle test</Dialog.Title>
							<Dialog.Description>Keep Bits in charge of interaction.</Dialog.Description>
							<button data-testid="bits-first">First control</button>
							<Dialog.Close data-testid="bits-close">Close</Dialog.Close>
						</div>
					{/if}
				{/snippet}
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
<Accordion.Root type="single">
	<Accordion.Item value="one">
		<Accordion.Header>
			<Accordion.Trigger data-testid="bits-accordion-trigger">Accordion</Accordion.Trigger>
		</Accordion.Header>
		<Accordion.Content forceMount>
			{#snippet child({ props, open })}
				{#if open}
					<div {...props} data-testid="bits-accordion" transition:presence={{ duration: 240 }}>
						A native outro must survive the logical close.
					</div>
				{/if}
			{/snippet}
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
