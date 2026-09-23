<script lang="ts">
	import Node from './ComponentVariantNode.svelte';
</script>

<Node motion={{ initial: false, animate: 'visible' }}>
	<Node id="inherited" motion={{ variants: { visible: { opacity: [0, 0.6], x: [-10, 20] } } }} />
	<Node
		id="override"
		motion={{
			initial: 'hidden',
			variants: { visible: { opacity: 0.6 }, hidden: { opacity: 0.2 } }
		}}
	/>
</Node>
<Node id="independent" motion={{ variants: { visible: { opacity: 0.6 } } }} />
