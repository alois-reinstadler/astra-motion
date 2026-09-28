<script lang="ts">
	import DocArticle from '$lib/site/DocArticle.svelte';
	import { getDoc } from '$lib/site/docs.js';
</script>

<DocArticle doc={getDoc('getting-started')!} />
