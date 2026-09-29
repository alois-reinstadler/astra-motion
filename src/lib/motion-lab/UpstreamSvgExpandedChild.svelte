<script lang="ts">
	// Motion v13.4.4 (33f6e72); tests/motion-baseline/LICENSE.motion.
	import type { SVGAttributes } from 'svelte/elements';
	let attributes: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg {...attributes}></svg>
