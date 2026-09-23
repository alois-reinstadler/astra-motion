<script lang="ts">
	import { resolve } from '$app/paths';
	import { routeShared } from 'astra-motion/routes';
</script>

<h1>Route detail</h1>
<a id="route-back" href={resolve('/')}>Back</a>
<article
	id="route-detail"
	style="padding:40px;background:#def"
	{@attach routeShared('review-card')}
>
	Shared route card
</article>
