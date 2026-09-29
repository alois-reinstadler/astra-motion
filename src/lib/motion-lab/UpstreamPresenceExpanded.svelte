<!-- Motion v13.4.4 adaptation; tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { AnimatePresence, LayoutGroup, motion } from '../motion/index.js';
	import Item from './UpstreamPresenceExpandedItem.svelte';
	let {
		scenario = 'ordinary',
		initialItems = ['a'],
		initial,
		initialMode = 'sync',
		onComplete = () => {},
		anchorX = 'left',
		anchorY = 'top',
		direction = 'ltr',
		css = '',
		root
	}: {
		scenario?: string;
		initialItems?: string[];
		initial?: boolean;
		initialMode?: 'sync' | 'wait' | 'popLayout';
		onComplete?: () => void;
		anchorX?: 'left' | 'right';
		anchorY?: 'top' | 'bottom';
		direction?: 'ltr' | 'rtl';
		css?: string;
		root?: ShadowRoot;
	} = $props();
	let items = $state(untrack(() => initialItems));
	let mode = $state(untrack(() => initialMode));
	let custom = $state(2);
	let inner = $state(true);
	const removals: Record<string, () => void> = {};
	const events: { event: string; id: string; value?: number }[] = [];
	function capture(id: string, remove: () => void) {
		removals[id] = remove;
	}
	function report(event: string, id: string, value?: number) {
		events.push({ event, id, value });
	}
	export function select(next: string[]) {
		items = next;
	}
	export function configure(value: number) {
		custom = value;
	}
	export function changeMode(value: typeof mode) {
		mode = value;
	}
	export function dropInner() {
		inner = false;
	}
	export function release(id: string) {
		removals[id]?.();
	}
	export function read() {
		return events;
	}
	export function clear() {
		events.length = 0;
	}
</script>

{#if scenario === 'outside'}
	<Item id="outside" {scenario} {capture} {report} />
{:else if scenario === 'empty'}
	<AnimatePresence present={items.length > 0} onExitComplete={onComplete}>
		<div data-expanded-item="empty">
			<AnimatePresence propagate present={false}><span>Never mounted</span></AnimatePresence>
		</div>
	</AnimatePresence>
{:else if scenario.startsWith('reentry')}
	<AnimatePresence present={items.length > 0} {initial} {custom} onExitComplete={onComplete}>
		<div data-expanded-group>
			<Item id="fast" {scenario} {inner} {capture} {report} />
			<Item id="slow" {scenario} {inner} {capture} {report} />
		</div>
	</AnimatePresence>
{:else if scenario === 'nested-layout'}
	<LayoutGroup
		><AnimatePresence present={items.length > 0} onExitComplete={onComplete}>
			<motion.div
				data-expanded-item="outer"
				layout
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
			>
				<AnimatePresence present={inner}
					><motion.div
						data-expanded-item="inner"
						layout
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
					/></AnimatePresence
				>
			</motion.div>
		</AnimatePresence></LayoutGroup
	>
{:else if scenario === 'siblings' || scenario === 'shared-boundaries'}
	<LayoutGroup>
		{#each ['a', 'b'] as id (id)}
			<AnimatePresence present={items.includes(id)} onExitComplete={onComplete}>
				<motion.div
					data-expanded-item={id}
					layoutId={scenario === 'shared-boundaries' ? 'across-boundaries' : undefined}
					layout
					initial={false}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}>{id}</motion.div
				>
			</AnimatePresence>
		{/each}
	</LayoutGroup>
{:else if scenario === 'owner-reorder'}
	{#each items as id, index (id)}
		<div data-expanded-owner={id}>
			<AnimatePresence
				items={[index === 0 ? 'content' : 'spacer']}
				key={(value) => value}
				mode="wait"
				initial={false}
			>
				{#snippet children(value)}
					{#if value === 'content'}<motion.div
							data-expanded-content={id}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}>{id}</motion.div
						>{:else}<span data-expanded-spacer={id}>Spacer</span>{/if}
				{/snippet}
			</AnimatePresence>
		</div>
	{/each}
{:else}
	<div dir={direction} style="position:relative;width:320px;min-height:100px">
		<AnimatePresence
			{items}
			key={(id) => id}
			{mode}
			{initial}
			{custom}
			{anchorX}
			{anchorY}
			{root}
			onExitComplete={onComplete}
		>
			{#snippet children(id)}<Item {id} {scenario} {inner} {capture} {report} {css} />{/snippet}
		</AnimatePresence>
	</div>
{/if}
