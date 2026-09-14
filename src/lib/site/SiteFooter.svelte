<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<footer class="site-footer">
	<div>
		<a href={resolve('/')} class="footer-brand">astra ✳</a>
		<p>Made for the way Svelte moves.</p>
	</div>
	<nav aria-label="Footer navigation">
		<a href={resolve('/docs')}>Documentation</a><a href={resolve('/showcase')}>Showcase</a><a
			href={resolve('/examples')}>Examples</a
		><a href={resolve('/docs/[slug]#api-status', { slug: 'troubleshooting' })}
			>Status & limitations</a
		>
	</nav>
	<small>Independent project.<br />Powered by Svelte and Motion.</small>
</footer>

<style>
	.site-footer {
		max-width: 1328px;
		margin: 0 auto;
		padding: 38px 0;
		border-top: 1px solid #d9d8d0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 28px;
		color: #252821;
		font-family: 'Instrument Sans Variable', sans-serif;
	}
	.footer-brand {
		font-size: 28px;
		letter-spacing: -1px;
		font-weight: 650;
		text-decoration: none;
	}
	p,
	small {
		color: #64695c;
		font-size: 12px;
		line-height: 1.7;
		margin: 5px 0 0;
	}
	nav {
		display: flex;
		gap: 24px;
		font-size: 12px;
	}
	nav a {
		text-decoration: none;
	}
	nav a:hover {
		color: #b2321b;
	}
	a:focus-visible {
		outline: 2px solid #d34123;
		outline-offset: 4px;
	}
	@media (max-width: 750px) {
		.site-footer {
			align-items: flex-start;
			flex-direction: column;
		}
		nav {
			flex-wrap: wrap;
		}
	}
</style>
