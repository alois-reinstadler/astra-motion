<script lang="ts">
	import { resolve } from '$app/paths';
	import HmrTile from './HmrTile.svelte';
</script>

<h1>Component hot replacement</h1>
<HmrTile />
<a href={resolve('/lifecycle/cache')} data-testid="leave-hmr">Destroy the fixture</a>
