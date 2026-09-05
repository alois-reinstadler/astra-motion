<script lang="ts">
	import DocArticle from '$lib/site/DocArticle.svelte';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<DocArticle doc={data.doc} />
