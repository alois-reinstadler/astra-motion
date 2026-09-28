<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	let {
		label,
		ref = $bindable(),
		...attributes
	}: SVGAttributes<SVGCircleElement> & { label: string; ref?: SVGCircleElement | null } = $props();
	function connect(node: SVGCircleElement) {
		ref = node;
		return () => {
			if (ref === node) ref = null;
		};
	}
</script>

<circle {...attributes} aria-label={label} {@attach connect} />
