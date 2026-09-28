<script lang="ts">
	import { useAnimationFrame } from '../motion/index.js';
	let count = $state(0);
	useAnimationFrame(() => count++);
</script>

<output data-composition-frames>{count}</output>
