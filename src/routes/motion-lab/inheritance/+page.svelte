<script lang="ts">
	import { resolve } from '$app/paths';
	import Inheritance from '$lib/motion-lab/LexicalInheritance.svelte';
</script>

<svelte:head><title>Declared motion parents — Astra Motion</title></svelte:head>
<main class="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
	<a href={resolve('/motion-lab')}>← Motion lab</a>
	<h1 class="text-3xl font-semibold">Declared motion parents</h1>
	<p>
		This child inherits its declared outer parent's variants, even with a different motion binding
		between them. Changing the intervening binding should leave it still. Its first appearance
		starts at the final keyframe because it inherits initial: false.
	</p>
	<Inheritance />
</main>
