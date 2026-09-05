<script lang="ts">
	import { resolve } from '$app/paths';
	import { createAttachmentKey } from 'svelte/attachments';
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { createLayout } from '$lib/motion/layout.js';
	import { createMotion } from '$lib/motion/motion.svelte.js';
	import MotionCard from '$lib/motion-lab/MotionCard.svelte';

	const layout = createLayout();
	const revealOptions = {
		initial: { opacity: 0, y: -4 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -4 },
		transition: { duration: 0.2 }
	};
	const accordionMotion = createMotion(revealOptions);
	const keyboardMotion = createMotion(revealOptions);
	const dialogMotion = createMotion({
		initial: { opacity: 0, scale: 0.96 },
		animate: { opacity: 1, scale: 1 },
		exit: { opacity: 0, scale: 0.96 },
		transition: { duration: 0.2 },
		layout: true,
		layoutGroup: layout
	});
	const overlayMotion = createMotion({
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 0.2 }
	});
	const position = { [createAttachmentKey()]: layout({ mode: 'position' }) };
	let accordion = $state('');
	let extra = $state(false);
	let open = $state(false);
	let dialogOwner = $state(true);
	let dialogExpanded = $state(false);
	let filter = $state(false);
	let reverse = $state(false);
	let removed = $state<number[]>([]);
	const items = [
		{ id: 1, name: 'Atlas', category: 'Interface' },
		{ id: 2, name: 'Orbit', category: 'Brand' },
		{ id: 3, name: 'Field notes', category: 'Interface' },
		{ id: 4, name: 'Open water', category: 'Brand' },
		{ id: 5, name: 'Assembly', category: 'Interface' },
		{ id: 6, name: 'Daylight', category: 'Brand' }
	];
	const visible = $derived.by(() => {
		const result = items.filter(
			(item) => !removed.includes(item.id) && (!filter || item.category === 'Interface')
		);
		return reverse ? result.toReversed() : result;
	});
</script>

<svelte:head>
	<title>Real components — Astra Motion</title>
	<meta
		name="description"
		content="Try Motion in existing shadcn accordion, dialog and card components."
	/>
</svelte:head>

<main class="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
	<header class="flex flex-col gap-4">
		<a
			href={resolve('/motion-lab')}
			class="text-sm text-muted-foreground underline underline-offset-4">← Motion lab</a
		>
		<h1 class="text-4xl font-semibold tracking-tight">Real components. Real interruptions.</h1>
		<p class="max-w-2xl text-muted-foreground">
			These are the existing shadcn components with motion enabled. Try rapid clicks, keyboard
			controls, changing content and removing things halfway through an animation.
		</p>
	</header>

	<section class="flex flex-col gap-4" aria-labelledby="accordion-heading">
		<div>
			<p class="text-xs text-muted-foreground">01 / CONTENT</p>
			<h2 id="accordion-heading" class="text-2xl font-semibold">Accordion</h2>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button
				variant="outline"
				data-testid="component-accordion-toggle"
				onclick={() => (accordion = accordion ? '' : 'details')}>Toggle rapidly</Button
			>
			<Button variant="outline" data-testid="component-extra" onclick={() => (extra = !extra)}
				>Change content</Button
			>
		</div>
		<Accordion.Root type="single" bind:value={accordion}>
			<Accordion.Item value="details">
				<Accordion.Trigger data-testid="component-accordion-trigger"
					>Does the content stay readable?</Accordion.Trigger
				>
				<Accordion.Content motion={accordionMotion} data-testid="component-accordion-content">
					<p>
						Height reveals the content without stretching its letters. Open and close repeatedly,
						including before the previous movement finishes.
					</p>
					{#if extra}<p data-testid="component-extra-content">
							This extra paragraph changes the natural height. Keyboard navigation and the trigger's
							expanded state still belong to the original accordion.
						</p>{/if}
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="keyboard">
				<Accordion.Trigger>Try the arrow keys</Accordion.Trigger>
				<Accordion.Content motion={keyboardMotion}
					><p>
						Focus a heading, move between headings with the arrow keys, and use Enter or Space to
						toggle it.
					</p></Accordion.Content
				>
			</Accordion.Item>
		</Accordion.Root>
	</section>

	<section class="flex flex-col gap-4" aria-labelledby="dialog-heading">
		<div>
			<p class="text-xs text-muted-foreground">02 / OVERLAY</p>
			<h2 id="dialog-heading" class="text-2xl font-semibold">Dialog</h2>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if dialogOwner}
				<Dialog.Root bind:open>
					<Dialog.Trigger data-testid="component-dialog-trigger">Open motion dialog</Dialog.Trigger>
					<Dialog.Content motion={dialogMotion} {overlayMotion} data-testid="component-dialog">
						<Dialog.Header {...position}>
							<Dialog.Title
								><span class="block" {@attach layout({ mode: 'position' })}
									>A dialog that can change</span
								></Dialog.Title
							>
							<Dialog.Description
								>Try Escape, Tab and closing during the entrance.</Dialog.Description
							>
						</Dialog.Header>
						<label class="flex flex-col gap-2" {...position}
							>Project name<Input data-testid="component-dialog-input" value="Astra" /></label
						>
						<Button
							variant="outline"
							data-testid="component-dialog-expand"
							{...position}
							onclick={() => (dialogExpanded = !dialogExpanded)}
							><span class="block" {@attach layout({ mode: 'position' })}>Change dialog height</span
							></Button
						>
						{#if dialogExpanded}<p
								class="block"
								data-testid="component-dialog-extra"
								{@attach layout({ mode: 'position' })}
							>
								Additional content changes the target geometry while the surface stays centered. The
								keyboard focus should remain inside the open dialog.
							</p>{/if}
						<Dialog.Footer {...position}>
							<Button
								variant="destructive"
								data-testid="component-dialog-destroy"
								onclick={() => (dialogOwner = false)}>Destroy owner</Button
							>
							<Dialog.Close data-testid="component-dialog-close">Done</Dialog.Close>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			{/if}
			<Button
				variant="outline"
				data-testid="component-dialog-reset"
				onclick={() => {
					open = false;
					dialogOwner = true;
				}}>Reset dialog</Button
			>
		</div>
		<p class="text-sm text-muted-foreground">
			Closing should return focus immediately while the surface finishes its exit.
		</p>
	</section>

	<section class="flex flex-col gap-4" aria-labelledby="cards-heading">
		<div>
			<p class="text-xs text-muted-foreground">03 / COLLECTION</p>
			<h2 id="cards-heading" class="text-2xl font-semibold">Filterable cards</h2>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button
				variant="outline"
				data-testid="component-filter"
				aria-pressed={filter}
				onclick={() => (filter = !filter)}>Interface only</Button
			>
			<Button variant="outline" data-testid="component-reorder" onclick={() => (reverse = !reverse)}
				>Reverse order</Button
			>
			<Button
				variant="outline"
				data-testid="component-cards-reset"
				onclick={() => {
					removed = [];
					filter = false;
					reverse = false;
				}}>Reset cards</Button
			>
		</div>
		<div class="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="component-grid">
			{#each visible as item (item.id)}
				<MotionCard {...item} {layout} onremove={() => (removed = [...removed, item.id])} />
			{/each}
		</div>
		<Card.Root
			><Card.Content
				><p class="text-sm text-muted-foreground">
					Filter and reverse in quick succession. Exiting cards should leave the grid flow
					immediately; surviving cards should head straight for their latest positions.
				</p></Card.Content
			></Card.Root
		>
	</section>
</main>
