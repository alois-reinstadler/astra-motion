<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	let { compact = false }: { compact?: boolean } = $props();
	const links = [
		{ href: '/docs', title: 'Documentation' },
		{ href: '/showcase', title: 'Showcase' },
		{ href: '/examples', title: 'Examples' }
	] as const;
</script>

<header class="site-header" class:compact>
	<a class="site-logo" href={resolve('/')} aria-label="Astra Motion home"
		>astra<span aria-hidden="true">✳</span><small>MOTION</small></a
	>
	<nav aria-label="Main navigation">
		{#each links as link (link.href)}
			<a
				href={resolve(link.href)}
				aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}>{link.title}</a
			>
		{/each}
	</nav>
	<span class="site-version"><i></i> EARLY ACCESS</span>
</header>

<style>
	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		max-width: 1440px;
		padding: 27px 56px;
		margin: auto;
		border-bottom: 1px solid #d9d8d0;
		color: #252821;
		font-family: 'Instrument Sans Variable', sans-serif;
		background: #f7f7f0;
	}
	.site-logo {
		display: flex;
		align-items: baseline;
		gap: 5px;
		text-decoration: none;
		font-size: 35px;
		font-weight: 650;
		letter-spacing: -2px;
		line-height: 1;
	}
	.site-logo span {
		color: #d34123;
		font-size: 29px;
		margin-left: 1px;
	}
	.site-logo small {
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1.5px;
		margin-left: 7px;
	}
	nav {
		display: flex;
		gap: 30px;
		font-size: 13px;
		font-weight: 550;
	}
	nav a {
		padding: 8px 0;
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}
	nav a:hover,
	nav a[aria-current] {
		border-color: #d34123;
		color: #b2321b;
	}
	.site-version {
		display: flex;
		gap: 8px;
		align-items: center;
		font:
			9px ui-monospace,
			monospace;
		letter-spacing: 1px;
		white-space: nowrap;
	}
	.site-version i {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #d34123;
	}
	a:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 5px;
	}
	.compact {
		max-width: none;
		padding-top: 18px;
		padding-bottom: 18px;
	}
	@media (max-width: 750px) {
		.site-header {
			padding: 22px 24px;
			flex-wrap: wrap;
			gap: 20px;
		}
		.site-logo {
			font-size: 30px;
		}
		.site-version {
			margin-left: auto;
		}
		nav {
			order: 3;
			width: 100%;
			gap: 18px;
			flex-wrap: wrap;
			font-size: 12px;
		}
	}
</style>
