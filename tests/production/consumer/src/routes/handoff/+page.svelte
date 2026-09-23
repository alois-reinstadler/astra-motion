<script lang="ts">
	import { motion } from 'astra-motion';
	import { routeShared } from 'astra-motion/routes';
	import { resolve } from '$app/paths';
</script>

<h1>Retained route source</h1>
<a href={resolve('/handoff/detail')}>Open detail</a>
<div data-route-source {@attach routeShared('card')}>Shared card</div>
<motion.div
	data-unrelated-exit
	motion={{
		initial: false,
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 1 }
	}}>Unrelated exiting sibling</motion.div
>
