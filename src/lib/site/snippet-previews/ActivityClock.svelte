<script lang="ts">
	import { useActivity, useActivityEffect } from '$lib/motion/index.js';
	const activity = useActivity();
	let seconds = $state(0);

	useActivityEffect(() => {
		const timer = setInterval(() => seconds++, 1000);
		return () => clearInterval(timer);
	});
</script>

<p>Active for {seconds} seconds. Phase: {activity.phase}.</p>
