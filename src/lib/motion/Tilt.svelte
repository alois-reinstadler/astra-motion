<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { TiltOptions } from './tilt-controller.svelte.js';

	export type TiltProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> &
		TiltOptions & { children: Snippet };
</script>

<script lang="ts">
	import { createTilt, tiltPerspective } from './tilt-controller.svelte.js';

	let {
		children,
		perspective = 800,
		maxRotateX = 12,
		maxRotateY = 12,
		axis = 'both',
		spring,
		disabled = false,
		...attributes
	}: TiltProps = $props();
	const tilt = createTilt(() => ({ maxRotateX, maxRotateY, axis, spring, disabled }));
</script>

<div {...attributes} data-astra-tilt>
	<div style:perspective="{tiltPerspective(perspective)}px" data-astra-tilt-perspective>
		<div {@attach tilt} data-astra-tilt-content>
			{@render children()}
		</div>
	</div>
</div>
