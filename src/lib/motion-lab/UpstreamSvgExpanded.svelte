<script lang="ts">
	// Motion v13.4.4 (33f6e72); source mapping/MIT: tests/motion-baseline.
	import { motion, useMotionValue, useTransform } from '../motion/index.js';
	import CustomSvg from './UpstreamSvgExpandedChild.svelte';
	let { mode = 'initial' }: { mode?: string } = $props();
	const Custom = motion.create(CustomSvg, { namespace: 'svg' });
	const source = useMotionValue(50);
	const progress = useTransform(source, [0, 100], [0, 1]);
	const fill = useTransform(source, [0, 100], ['#000', '#fff']);
	const radius = useMotionValue(40);
	const radiusFill = useTransform(radius, [40, 100], ['#00f', '#f00']);
	const rawTransform = useMotionValue('translate(10px, 20px)');
	const text = useMotionValue(10),
		otherText = useMotionValue(30);
	let replaced = $state(false);
	let changed = $state(false);
	let aliasesRemoved = $state(false);
	export function removeAliases() {
		aliasesRemoved = true;
	}
	export function change() {
		changed = true;
	}
	export function replaceText() {
		replaced = true;
	}
	export function values() {
		return { source, radius, radiusFill, rawTransform, text, otherText };
	}
</script>

{#if mode === 'viewbox' || mode === 'factory'}
	{#if mode === 'factory'}
		<Custom
			data-case="viewbox"
			viewBox="0 0 100 100"
			animate={{ viewBox: changed ? '100 100 200 200' : '0 0 100 100' }}
			transition={{ duration: 0.15 }}
		/>
	{:else}
		<motion.svg
			data-case="viewbox"
			viewBox="0 0 100 100"
			animate={{ viewBox: changed ? '100 100 200 200' : '0 0 100 100' }}
			transition={{ delay: 0.25, duration: 0.15 }}
		/>
	{/if}
{:else if mode === 'root'}
	<motion.svg
		data-case="root"
		initial={{ rotate: 0 }}
		animate={{ rotate: 100 }}
		transition={{ duration: 0.15 }}
		width={100}
		height={100}
	/>
{:else}
	<svg
		data-case="svg"
		width={500}
		height={500}
		viewBox="0 0 500 500"
		style="overflow:visible;--paint:rgb(180, 0, 180)"
	>
		{#if mode === 'initial'}
			<motion.path
				data-case="derived"
				d="M0 0 L100 0"
				style={{ x: 10, y: 10, pathLength: progress, opacity: progress }}
			/>
			<motion.circle data-case="fill" r={20} {fill} />
			<motion.rect data-case="static" width={100} height={100} style={{ rotate: 45 }} />
		{:else if mode === 'transform'}
			<motion.rect
				data-case="transform"
				width={100}
				height={100}
				initial={{ rotate: 0 }}
				animate={{ rotate: changed ? 90 : 45 }}
				transition={{ duration: 0.15 }}
			/>
		{:else if mode === 'geometry'}
			<motion.rect data-case="rotate" width={100} height={100} style={{ rotate: 45 }} />
			<motion.rect data-case="scale" x={0} y={200} width={100} height={100} style={{ scale: 2 }} />
			<motion.rect
				data-case="translate"
				x={0}
				y={350}
				width={100}
				height={100}
				style={{ x: 150 }}
			/>
		{:else if mode === 'css-var'}
			<motion.circle
				data-case="paint"
				r={20}
				initial={{ fill: '#000' }}
				animate={{ fill: changed ? 'var(--paint)' : '#000' }}
				transition={{ duration: 0.15 }}
			/>
		{:else if mode === 'origin'}
			<motion.rect
				data-case="default-origin"
				width={100}
				height={100}
				animate={{ rotate: 45 }}
				transition={{ duration: 0 }}
			/>
			<motion.rect
				data-case="origin-only"
				width={100}
				height={100}
				animate={{ originX: 1 }}
				transition={{ duration: 0 }}
			/>
			<motion.rect
				data-case="origin-x"
				width={100}
				height={100}
				animate={{ rotate: 180, skewX: 45, originX: 1 }}
				transition={{ duration: 0 }}
			/>
			<motion.rect
				data-case="origin-y"
				width={100}
				height={100}
				animate={{ rotate: 180, skewX: 45, originY: 1 }}
				transition={{ duration: 0 }}
			/>
			<motion.rect
				data-case="origin-xy"
				width={100}
				height={100}
				animate={{ rotate: 180, skewX: 45, originX: 1, originY: 1 }}
				transition={{ duration: 0 }}
			/>
		{:else if mode === 'aliases'}
			<motion.rect
				data-case="aliases"
				width={30}
				height={30}
				attrX={aliasesRemoved ? undefined : changed ? 30 : 10}
				attrY={aliasesRemoved ? undefined : changed ? 40 : 20}
				attrScale={aliasesRemoved ? undefined : changed ? 3 : 2}
				style={{ x: 5, scale: 1.5 }}
			/>
			<motion.rect
				data-case="animated-aliases"
				width={30}
				height={30}
				attrX={aliasesRemoved ? undefined : changed ? 30 : 10}
				attrY={aliasesRemoved ? undefined : changed ? 40 : 20}
				attrScale={aliasesRemoved ? undefined : changed ? 3 : 2}
				animate={{ attrX: 80, attrY: 90, attrScale: 4 }}
				transition={{ duration: 0 }}
				style={{ x: 5, scale: 1.5 }}
			/>
		{:else if mode === 'radius'}
			<motion.circle
				data-case="radius"
				r={radius}
				fill={radiusFill}
				animate={{ r: changed ? 100 : 40 }}
				transition={{ duration: 0.15 }}
			/>
		{:else if mode === 'new-attributes'}
			<motion.svg animate={{ rotate: 100 }} transition={{ duration: 0.15 }}>
				<motion.circle
					data-case="dash"
					r={20}
					animate={{ strokeDasharray: ['1px, 200px', '100px, 200px'], strokeDashoffset: [0, -125] }}
					transition={{ duration: 0.15 }}
				/>
			</motion.svg>
		{:else if mode === 'raw'}
			<motion.g data-case="raw" transform={rawTransform}><rect width={50} height={50} /></motion.g>
		{:else if mode === 'path'}
			<motion.circle
				data-case="path"
				r={10}
				style={{
					offsetPath: "path('M 0 0 L 100 100')",
					offsetDistance: '25%',
					offsetRotate: 'auto',
					offsetAnchor: 'center'
				}}
			/>
		{:else if mode === 'text'}
			<motion.text data-case="text" children={replaced ? otherText : text} />
		{:else if mode === 'ssr'}
			<motion.circle
				data-case="ssr-circle"
				cx={source}
				initial={{ strokeWidth: 10 }}
				style={{ x: 100, pathLength: progress }}
			/>
			<motion.path
				data-case="ssr-path"
				d="M0 0 L100 0"
				initial={{ x: 0 }}
				style={{ transformBox: 'view-box' }}
			/>
		{/if}
	</svg>
{/if}
