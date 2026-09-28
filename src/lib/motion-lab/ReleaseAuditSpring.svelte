<script lang="ts">
	import { useSpring, type UseSpringOptions } from '../motion/value-hooks.svelte.js';
	import { provideActivityState } from '../motion/activity-scope.js';
	let visible = $state(true);
	let settings = $state<UseSpringOptions>({ duration: 0.2, bounce: 0 });
	let scalar = $state(0);
	provideActivityState(() => visible);
	const number = useSpring(0, () => settings);
	const units = useSpring('0px', () => settings);
	const reactive = useSpring(
		() => scalar,
		() => settings
	);
	export function getApi() {
		return { number, units, reactive };
	}
	export function configure(next: {
		visible?: boolean;
		settings?: UseSpringOptions;
		scalar?: number;
	}) {
		if (next.visible !== undefined) visible = next.visible;
		if (next.settings) settings = next.settings;
		if (next.scalar !== undefined) scalar = next.scalar;
	}
</script>
