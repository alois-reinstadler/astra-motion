<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { createLayout } from './layout.js';
	import { readLayoutScope, provideLayoutScope } from './layout-context.js';
	import { readMotionConfig } from './config.js';
	let {
		id,
		inherit = true,
		children
	}: { id?: string; inherit?: boolean | 'id'; children: Snippet } = $props();
	const parent = readLayoutScope();
	// Like upstream, group identity belongs to this mount. Key the group to replace its identity.
	const namespace = untrack(() =>
		inherit && parent?.id ? (id ? `${parent.id}-${id}` : parent.id) : id
	);
	const cohort = untrack(() => (inherit === true && parent ? parent.cohort : {}));
	const config = readMotionConfig();
	const controller = createLayout({
		id: namespace ?? 'astra-default',
		cohort,
		get transition() {
			return (
				config().layoutTransition ??
				config().transition ?? { duration: 0.45, ease: [0.4, 0, 0.1, 1] }
			);
		},
		get reducedMotion() {
			return config().reducedMotion ?? 'never';
		}
	});
	provideLayoutScope({ id: namespace, controller, cohort });
</script>

{@render children()}
