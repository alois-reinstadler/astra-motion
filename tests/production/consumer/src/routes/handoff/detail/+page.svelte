<script lang="ts">
	import { routeShared } from 'astra-motion/routes';
	import { resolve } from '$app/paths';
</script>

<h1>Route destination</h1>
<a href={resolve('/handoff')}>Back to card</a>
<article
	data-route-destination
	style="padding: 40px; background: #def"
	{@attach routeShared('card')}
>
	Shared card
</article>
