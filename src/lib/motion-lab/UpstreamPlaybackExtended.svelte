<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { motion, createAnimate, useAnimate } from '../motion/index.js';
	import { useAnimate as useMini } from '../motion/mini-entry.js';
	const [scope, animate] = useAnimate();
	const [miniScope, mini] = useMini();
	const strict = createAnimate({ reducedMotion: 'never' });
	export const api = () => ({ scope, animate, miniScope, mini, strict });
</script>

<section {@attach scope.attach}>
	<div data-upstream-play="hybrid" style="opacity:1;width:100px;height:20px"></div>
	<div data-upstream-play="hybrid-second" style="opacity:1;width:100px;height:20px"></div>
	<motion.div
		data-upstream-play="layout"
		layout
		initial={false}
		style={{ x: 0, width: 20, height: 20 }}
	/>
</section>
<section {@attach miniScope.attach}>
	<div data-upstream-play="mini" style="opacity:1;width:100px;height:20px"></div>
	<div data-upstream-play="mini-second" style="opacity:1;width:100px;height:20px"></div>
</section>
<section {@attach strict.attach}>
	<div data-upstream-play="strict" style="opacity:1;width:100px;height:20px"></div>
	<div data-upstream-play="strict-second" style="opacity:1;width:100px;height:20px"></div>
</section>
