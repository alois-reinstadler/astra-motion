<script module lang="ts">
	export interface Measurement {
		phase: 'component-pre' | 'attachment-pre' | 'attachment-post' | 'cached';
		width: number;
		order: string;
		previousWidth?: number;
	}
</script>

<script lang="ts">
	let { record }: { record: (measurement: Measurement) => void } = $props();
	let width = $state(100);
	let items = $state(['a', 'b']);
	let root: Element | undefined;

	function measure(node: Element, phase: Measurement['phase'], previousWidth?: number) {
		const next = node.getBoundingClientRect().width;
		record({ phase, width: next, order: node.textContent ?? '', previousWidth });
		return next;
	}

	function componentPre() {
		void width;
		void items;
		if (root) measure(root, 'component-pre');
	}
	$effect.pre(componentPre);

	function probe(node: Element) {
		root = node;
		let previousWidth: number | undefined;
		function attachmentPre() {
			void width;
			void items;
			measure(node, 'attachment-pre');
		}
		function attachmentPost() {
			void width;
			void items;
			measure(node, 'attachment-post');
			previousWidth = measure(node, 'cached', previousWidth);
		}
		$effect.pre(attachmentPre);
		$effect(attachmentPost);
		return () => {
			root = undefined;
		};
	}

	export function change(nextWidth: number) {
		width = nextWidth;
		items = items.toReversed();
	}
</script>

<div style:width={`${width}px`} {@attach probe}>
	{#each items as item (item)}<span>{item}</span>{/each}
</div>
