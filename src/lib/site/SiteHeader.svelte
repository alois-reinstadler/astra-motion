<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	let { compact = false }: { compact?: boolean } = $props();
	const links = [
		{ href: '/docs', title: 'Documentation' },
		{ href: '/examples', title: 'Examples' },
		{ href: '/showcase', title: 'Showcase' },
		{ href: '/about', title: 'Why Astra' }
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
				aria-current={page.url.pathname === resolve(link.href) ||
				page.url.pathname.startsWith(`${resolve(link.href)}/`)
					? 'page'
					: undefined}>{link.title}</a
			>
		{/each}
	</nav>
	<a
		class="site-version"
		href={resolve('/status')}
		aria-current={page.url.pathname === resolve('/status') ? 'page' : undefined}
		><i></i> WORKING BETA</a
	>
</header>

<style>
	nav a::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 1px;
		background: #c23d22;
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	nav a:hover::after,
	nav a:focus-visible::after,
	nav a[aria-current]::after {
		transform: scaleX(1);
	}
	.site-logo span {
		transition: rotate 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.site-logo:hover span {
		rotate: 90deg;
	}
	@media (prefers-reduced-motion: reduce) {
		nav a::after,
		.site-logo span {
			transition: none;
		}
		.site-logo:hover span {
			rotate: none;
		}
	}

	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		max-width: 1440px;
		padding: 23px 56px;
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
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 8px 0;
		text-decoration: none;
		position: relative;
		transition: color 180ms ease;
	}
	nav a:hover,
	nav a[aria-current] {
		color: #b2321b;
	}
	.site-version {
		text-decoration: none;
		display: flex;
		min-height: 44px;
		gap: 8px;
		align-items: center;
		font:
			10px ui-monospace,
			monospace;
		letter-spacing: 1px;
		white-space: nowrap;
	}
	.site-version:hover,
	.site-version[aria-current] {
		color: #b2321b;
		text-decoration: underline;
		text-underline-offset: 4px;
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
			padding: 16px 24px;
			flex-wrap: wrap;
			gap: 8px 12px;
		}
		.site-logo {
			font-size: 30px;
		}
		.site-version {
			text-decoration: none;
			margin-left: auto;
		}
		nav {
			order: 3;
			width: 100%;
			gap: 0 18px;
			flex-wrap: wrap;
			font-size: 12px;
		}
	}
	@media (max-width: 370px) {
		nav {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0 24px;
		}
		nav a {
			justify-self: start;
		}
	}
</style>
