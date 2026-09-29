<script lang="ts">
	// Motion v13.4.4 (33f6e72); see tests/motion-baseline/LICENSE.motion.
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { TargetAndTransition } from '../motion/index.js';
	let {
		animate,
		label,
		...attributes
	}: HTMLButtonAttributes & {
		animate?: TargetAndTransition;
		label: string;
	} = $props();
</script>

<button {...attributes} data-forwarded={animate ? JSON.stringify(animate) : 'filtered'}>
	{label}
</button>
