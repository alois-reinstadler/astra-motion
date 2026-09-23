<script lang="ts">
	import { createAnimate } from '../motion/animate.js';
	import type { MotionPolicy } from '../motion/policy.js';

	const policy = $state<MotionPolicy>({ reducedMotion: 'never' });
	const getter = createAnimate(() => policy);
	const object = createAnimate(policy);
	let shown = $state(true);

	export function scopes() {
		return [getter, object];
	}
	export function reduce(value: boolean) {
		policy.reducedMotion = value ? 'always' : 'never';
	}
	export function remove() {
		shown = false;
	}
</script>

{#if shown}
	<section data-policy-getter {@attach getter.attach}>
		<div class="subject" style="opacity:1">Getter</div>
	</section>
	<section data-policy-object {@attach object.attach}>
		<div class="subject" style="opacity:1">Object</div>
	</section>
{/if}
