<script lang="ts">
	import { provideMotionConfig } from '../motion/config.js';
	import { createAnimate } from '../motion/animate.js';
	const notify = provideMotionConfig(() => ({
		transition: { duration: 0.123, ease: 'linear' },
		reducedMotion: 'never'
	}));
	$effect(notify);
	const scope = createAnimate();
	export function getScope() {
		return scope;
	}
</script>

<section {@attach scope.attach}><span style="opacity:1">Server timeline content</span></section>
