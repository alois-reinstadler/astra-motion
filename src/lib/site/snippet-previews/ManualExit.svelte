<script lang="ts">
	import { usePresence } from '$lib/motion/index.js';
	const presence = usePresence();
	const remove = presence.safeToRemove;
</script>

<div
	{@attach (element) => {
		if (presence.isPresent) return;
		let active = true;
		const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 200,
			fill: 'forwards'
		});
		void animation.finished.then(
			() => {
				if (active) remove();
			},
			() => {}
		);
		return () => {
			active = false;
			animation.cancel();
		};
	}}
>
	Application-owned exit
</div>
