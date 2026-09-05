<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<h1>Another document</h1>
<p data-testid="outside-document">
	The previous page should be eligible for the browser’s back/forward cache.
</p>
<a href={resolve('/lifecycle/cache')} data-sveltekit-reload>Load a fresh cache fixture</a>
