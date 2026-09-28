<script lang="ts">
	import { resolve } from '$app/paths';
	import ProjectArticle from '$lib/site/ProjectArticle.svelte';
</script>

<ProjectArticle
	eyebrow="PROJECT STATUS / WORKING BETA"
	title="Ready to try. Still being qualified."
	intro="The repository contains a working Svelte 5 library, documentation and examples. Version 0.0.1 is a local beta; a public registry release has not been announced."
>
	<section id="supported">
		<h2>What you can build today</h2>
		<div>
			<ul>
				<li>
					Animate reactive targets with initial, animate and exit states, variants and MotionValues.
				</li>
				<li>
					Coordinate conditional and keyed exits, retained Activity panels, automatic layout changes
					and shared elements.
				</li>
				<li>
					Add hover, tap, focus, pan, constrained dragging and controlled reorder lists or grids.
					Connect reactive Motion Values to scroll, springs, transforms and timelines.
				</li>
				<li>
					Animate HTML and SVG, share configuration and load animation features on demand.
					Coordinate state changes with View Transitions, including optional SvelteKit navigation
					integration.
				</li>
			</ul>
			<p><a href={resolve('/examples')}>Explore the interactive examples </a></p>
		</div>
	</section>
	<section id="evaluation">
		<h2>Start with one interaction</h2>
		<div>
			<p>
				Build a local package from the repository and install the tarball in your app. Start with a
				panel, list or dialog you can test in isolation. The getting-started guide includes the
				commands and entry points.
			</p>
			<p>
				Test interrupted animations, keyboard interaction, reduced motion and navigation in your own
				layout. Keep the tested dependency versions pinned while evaluating the beta.
			</p>
			<p>
				<a href={resolve('/docs/[slug]', { slug: 'getting-started' })}
					>Install from the repository
				</a>
			</p>
		</div>
	</section>
	<section id="qualification">
		<h2>What has been checked</h2>
		<div>
			<p>
				The current parity matrix records each contract, its upstream reference, the Svelte API, and
				its verification evidence. Checks include Chromium, Firefox and WebKit component tests,
				production examples, and independent applications installed from the packed package.
			</p>
			<p>
				Use the dated qualification records for exact results and remaining work. Automated WebKit
				coverage does not establish physical Safari/iOS performance, and a low-end-device
				performance campaign remains separate release work.
			</p>
			<p>
				<a href="https://github.com/alois-reinstadler/astra-motion/blob/main/docs/parity/MATRIX.md"
					>Read the parity matrix and verification records
				</a>
			</p>
		</div>
	</section>
	<section id="limits">
		<h2>Know the boundaries</h2>
		<div>
			<ul>
				<li>
					Astra packages one DOM engine: Motion DOM 13.4.4, Framer Motion 13.4.4’s DOM entry and
					Motion Utils 13.3.0. Consumers need no separate Motion installation or dependency
					overrides. Layout projection uses undocumented exports; upgrades need compatibility
					testing.
				</li>
				<li>
					The package removes an unsupported Electron-only <code>HTMLWebViewElement</code>
					declaration from the bundled types. Strict packed-consumer checks use
					<code>skipLibCheck: false</code>; upstream runtime algorithms remain unchanged.
				</li>
				<li>
					Large animated layouts are expensive. A recorded 500-participant workload is slow under
					CPU throttling, even with explicit layout transactions.
				</li>
				<li>
					AnimatePresence uses explicit keys and snippets. AnimateActivity retains DOM and pauses
					Astra-owned work; ordinary Svelte effects need the activity-aware helper to pause.
					AnimateView uses an explicit state-update transaction. These Svelte adaptations are
					documented on their component pages.
				</li>
				<li>
					Static 2D transformed wrappers and nested sticky/scroll/clipping boundaries have
					regression coverage. Animated wrapper transforms, perspective and 3D layouts remain
					unqualified.
				</li>
			</ul>
			<p>
				<a href={resolve('/docs/[slug]', { slug: 'troubleshooting' })}
					>Troubleshoot a specific interaction
				</a>
			</p>
		</div>
	</section>
	<section id="release">
		<h2>Before a public release</h2>
		<div>
			<p>
				Astra is MIT licensed. A public release still needs a published package and broader device
				qualification. There is no release date to plan against yet.
			</p>
			<p>
				For a bug report, include the smallest component that reproduces the problem, your Svelte
				and Motion versions, the browser, and what happens when the animation is interrupted.
			</p>
			<p>
				<a href="https://github.com/alois-reinstadler/astra-motion/issues"
					>Report an issue on GitHub
				</a>
			</p>
		</div>
	</section>
</ProjectArticle>
