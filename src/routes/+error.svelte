<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ProjectArticle from '$lib/site/ProjectArticle.svelte';
</script>

<svelte:head
	><title>{page.status === 404 ? 'Page not found' : 'Something went wrong'} — Astra Motion</title
	></svelte:head
>
<ProjectArticle
	eyebrow={String(page.status)}
	title={page.status === 404 ? 'That page isn’t here.' : 'We couldn’t open this page.'}
	intro={page.status === 404
		? 'The link may have moved. Pick up from the documentation or return to the homepage.'
		: 'Try reloading the page. If the problem continues, please report it on GitHub.'}
>
	<section>
		<h2>Keep exploring</h2>
		<div>
			<p><a href={resolve('/docs')}>Read the documentation →</a></p>
			<p><a href={resolve('/')}>Return home →</a></p>
		</div>
	</section>
</ProjectArticle>
