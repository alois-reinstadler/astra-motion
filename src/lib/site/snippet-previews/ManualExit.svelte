<script lang="ts">
	import { usePresence } from '$lib/motion/index.js';
	const presence = usePresence();
</script>

<div
	{@attach (element) => {
		if (presence.isPresent) return;
		const remove = presence.safeToRemove;
		const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 200,
			fill: 'forwards'
		});
		void animation.finished.then(remove, () => {});
		return () => animation.cancel();
	}}
>
	Application-owned exit
</div>
