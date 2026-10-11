<script lang="ts">
	import { motion } from '$lib/motion/index.js';
	let selected = $state(false);
</script>

<motion.button
	aria-pressed={selected}
	onclick={() => (selected = !selected)}
	animate={{ scale: selected ? 1.1 : 1 }}
	whileTap={{ scale: 0.95 }}
>
	{selected ? 'Selected' : 'Choose item'}
</motion.button>
