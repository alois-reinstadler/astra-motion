<script lang="ts">
	import AnimateView from '../motion/AnimateView.svelte';
	import { startViewTransition } from '../motion/view-transitions.js';
	import type { ViewAnimationType, ViewTransitionHandle } from '../motion/view-types.js';
	import type { AnimationPlaybackControls } from 'motion-dom';
	let {
		onStart,
		onComplete,
		onTypes,
		onDiagnostic,
		duplicate = false,
		custom = false,
		multiple = false
	}: {
		onStart?: (animation: AnimationPlaybackControls, type: ViewAnimationType) => void;
		onComplete?: (type: ViewAnimationType) => void;
		onTypes?: (types: string[]) => void;
		onDiagnostic?: (message: string) => void;
		duplicate?: boolean;
		custom?: boolean;
		multiple?: boolean;
	} = $props();
	let visible = $state(true);
	let selected = $state('a');
	let count = $state(0);
	function definition(types: string[]) {
		onTypes?.(types);
		return custom
			? { opacity: [0.4, 1], filter: ['blur(2px)', 'blur(0px)'], transition: { duration: 0.08 } }
			: { transition: { duration: 0.08 } };
	}
	export function toggle(): ViewTransitionHandle {
		return startViewTransition(
			() => {
				visible = !visible;
			},
			{ reducedMotion: 'never', onDiagnostic }
		);
	}
	export function share(): ViewTransitionHandle {
		return startViewTransition(
			() => {
				selected = selected === 'a' ? 'b' : 'a';
			},
			{ reducedMotion: 'never', onDiagnostic }
		);
	}
	export function change(): ViewTransitionHandle {
		return startViewTransition(
			() => {
				count++;
			},
			{ reducedMotion: 'never', onDiagnostic }
		);
	}
	export function asyncChange(): ViewTransitionHandle {
		return startViewTransition(
			async (context) => {
				await Promise.resolve();
				context.addType('loaded');
				count++;
			},
			{ types: ['next'], reducedMotion: 'never', onDiagnostic }
		);
	}
</script>

<main>
	{#if visible}
		{#key selected}
			<AnimateView
				name="shared-card"
				transition={{ duration: 0.08 }}
				enter={definition}
				exit={definition}
				update={definition}
				share={definition}
				onAnimationStart={onStart}
				onAnimationComplete={onComplete}
			>
				{#snippet children(view)}
					<div
						{@attach view}
						data-native-view={selected}
						style="view-transition-name: authored-card !important; width: 160px; height: 70px; background: rgb(110, 75, 240);"
					>
						{selected}:<span data-view-count>{count}</span>
					</div>
					{#if multiple}
						<div {@attach view} style="width: 80px; height: 50px; background: rgb(75, 110, 240);">
							Second root: {count}
						</div>
					{/if}
				{/snippet}
			</AnimateView>
		{/key}
	{/if}
	{#if duplicate}
		<AnimateView name="shared-card">
			{#snippet children(view)}
				<div {@attach view} style="width: 80px; height: 50px;">Duplicate</div>
			{/snippet}
		</AnimateView>
	{/if}
</main>
