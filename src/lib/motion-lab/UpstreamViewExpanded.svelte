<!-- Motion v13.4.4 adaptation; tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import {
		AnimateView,
		startViewTransition,
		type AnimationPlaybackControls,
		type ViewAnimationType
	} from '../motion/index.js';
	let {
		custom = false,
		onStart = () => {},
		onComplete = () => {}
	}: {
		custom?: boolean;
		onStart?: (controls: AnimationPlaybackControls, type: ViewAnimationType) => void;
		onComplete?: (type: ViewAnimationType) => void;
	} = $props();
	let present = $state(true),
		large = $state(false),
		count = $state(0);
	const definition = $derived(custom ? { clipPath: ['inset(10%)', 'inset(0%)'] } : {});
	export function change(kind: ViewAnimationType) {
		return startViewTransition(
			() => {
				if (kind === 'enter') present = true;
				else if (kind === 'exit') present = false;
				else if (kind === 'share') large = !large;
				else count++;
			},
			{ reducedMotion: 'never' }
		);
	}
</script>

{#if present}
	{#key large}
		<AnimateView
			name="expanded-view"
			transition={{ duration: 0.4, ease: 'linear' }}
			enter={definition}
			exit={definition}
			update={definition}
			share={definition}
			onAnimationStart={onStart}
			onAnimationComplete={onComplete}
		>
			{#snippet children(view)}<div
					data-expanded-view
					{@attach view}
					style:width={large ? '200px' : '100px'}
					style="height:100px;background:red"
				>
					{count}
				</div>{/snippet}
		</AnimateView>
	{/key}
{/if}
