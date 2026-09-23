<script lang="ts">
	import { createMotion, Motion, MotionConfig } from 'astra-motion';
	let options = $state({ animate: { x: 0 }, transition: { duration: 0.05 } });
	const object = createMotion(options);
	const getter = createMotion(() => options);
	const explicit = createMotion(() => ({
		animate: { x: options.animate.x },
		transition: { duration: 0.05 }
	}));
	const inherited = createMotion({
		initial: { opacity: 0.2 },
		animate: { opacity: 1 },
		transition: { duration: 0.05 }
	});
</script>

<section>
	<h2>Reactivity and provider</h2>
	<button id="mutate" onclick={() => (options.animate.x += 80)}>Mutate nested x</button>
	<button id="replace-target" onclick={() => (options.animate = { x: options.animate.x + 80 })}
		>Replace target</button
	>
	<div id="object" {...object.props}>Object</div>
	<div id="getter" {...getter.props}>Getter returning proxy</div>
	<Motion id="component-proxy" motion={options}>Motion with proxy</Motion>
	<div id="explicit" {...explicit.props}>Getter reading x</div>
	<MotionConfig reducedMotion="always">
		<div id="same-provider" {...inherited.props}>Binding created in provider owner</div>
		<Motion id="inside-provider" motion={{ initial: { opacity: 0.2 }, animate: { opacity: 1 } }}
			>Motion inside provider</Motion
		>
		<Motion id="initial-false" motion={{ initial: false, animate: { opacity: 0.7 } }}
			>Initial false</Motion
		>
	</MotionConfig>
</section>
