<script lang="ts">
	import { createLayout, popLayout, presence } from '../motion/index.js';
	const layout = createLayout({
		automatic: true,
		reducedMotion: 'never',
		transition: { duration: 0.65, ease: 'linear' }
	});
	let aligned = $state(false);
	let expanded = $state(false);
	let selected = $state(false);
	let visible = $state(true);
	let items = $state([0, 1, 2, 3]);
	export function align() {
		aligned = !aligned;
	}
	export function expand() {
		expanded = !expanded;
	}
	export function swap() {
		selected = !selected;
	}
	export function reorder() {
		items = items.toReversed();
	}
	export function remove() {
		items = items.filter((id) => id !== 0);
	}
	export function restore() {
		items = [0, ...items.filter((id) => id !== 0)];
	}
	export function disposeParent() {
		visible = false;
	}
	export function stats() {
		return layout.stats();
	}
	export async function deferredAlign() {
		await new Promise<void>((resolve) => setTimeout(resolve, 25));
		aligned = !aligned;
	}
</script>

{#if visible}
	<div data-automatic="parent">
		<div class="flex" style:justify-content={aligned ? 'flex-end' : 'flex-start'}>
			<div class="box" data-automatic="orb" {@attach layout()}></div>
		</div>
		<div class="size" data-automatic="size" {@attach layout()}>
			<p class="copy" {@attach layout({ mode: 'position' })}>
				{expanded
					? 'Intrinsic content grows into multiple lines. The browser determines the target height. No explicit transaction or numeric height is supplied by the component.'
					: 'Short content.'}
			</p>
		</div>
		<div class="marker" data-automatic="marker" {@attach layout({ mode: 'position' })}></div>
		<div class="items">
			{#each items as id (id)}
				<div
					class="item"
					data-automatic-item={id}
					{@attach layout({ mode: 'position' })}
					{@attach popLayout()}
					transition:presence|global={{ duration: 450, reducedMotion: 'never' }}
				>
					{id}
				</div>
			{/each}
		</div>
		<div class="shared">
			{#if selected}
				<div
					class="lead far"
					data-automatic="lead"
					{@attach layout({ id: 'shared', mode: 'position' })}
				></div>
			{:else}
				<div
					class="lead"
					data-automatic="lead"
					{@attach layout({ id: 'shared', mode: 'position' })}
				></div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.flex {
		display: flex;
		width: 320px;
		height: 44px;
	}
	.box {
		width: 40px;
		height: 40px;
		background: coral;
	}
	.size {
		width: 180px;
		padding: 12px;
		box-sizing: border-box;
		background: lightblue;
	}
	.copy {
		margin: 0;
		font: 16px/20px sans-serif;
	}
	.marker {
		width: 30px;
		height: 12px;
		background: navy;
	}
	.items {
		position: relative;
		display: flex;
		gap: 8px;
		margin-top: 20px;
	}
	.item {
		width: 48px;
		height: 40px;
		flex: none;
		background: lightgreen;
	}
	.shared {
		position: relative;
		width: 320px;
		height: 44px;
		margin-top: 20px;
	}
	.lead {
		position: absolute;
		left: 0;
		top: 0;
		width: 40px;
		height: 8px;
		background: black;
	}
	.far {
		left: 240px;
	}
</style>
