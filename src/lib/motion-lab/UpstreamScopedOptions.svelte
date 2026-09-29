<!-- Adapted from Motion v13.4.4 (33f6e72d); sources and MIT notice: tests/motion-baseline/README.md and LICENSE.motion. -->
<script lang="ts">
	import { useAnimate } from '../motion/index.js';
	import { useAnimate as useMini } from '../motion/mini-entry.js';
	const [scope, animate] = useAnimate();
	const [miniScope, mini] = useMini();
	export const api = () => ({ scope, animate, miniScope, mini });
</script>

<section {@attach scope.attach}>
	<div data-upstream-option="first" style="opacity:1;width:20px;height:20px"></div>
	<div data-upstream-option="second" style="opacity:1;width:20px;height:20px"></div>
</section>
<section {@attach miniScope.attach}>
	<div data-upstream-option="mini" style="opacity:0.8;width:20px;height:20px"></div>
	<div data-upstream-option="mini-second" style="opacity:1;width:20px;height:20px"></div>
</section>
