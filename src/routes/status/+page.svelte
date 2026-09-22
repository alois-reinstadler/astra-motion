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
				<li>Coordinate native Svelte exits, automatic layout changes and shared elements.</li>
				<li>
					Add hover, press, focus and bounded dragging, or connect animation to scroll and
					timelines.
				</li>
				<li>
					Enhance SvelteKit navigation with browser View Transitions. The other entry points work
					without SvelteKit.
				</li>
			</ul>
			<p><a href={resolve('/examples')}>Explore the interactive examples →</a></p>
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
					>Install from the repository →</a
				>
			</p>
		</div>
	</section>
	<section id="qualification">
		<h2>What has been checked</h2>
		<div>
			<p>
				The repository records production builds, installation into an independent SvelteKit app,
				server rendering and hydration, and browser regression checks. Recent gesture fixes have
				also been exercised in Chrome.
			</p>
			<p>
				Those checks are specific to the recorded versions and environments. A complete browser
				matrix for every new change, physical Safari/iOS testing and a low-end-device performance
				campaign remain release work.
			</p>
			<p>
				<a
					href="https://github.com/alois-reinstadler/astra-motion/blob/main/docs/research/production-qualification.md"
					>Read the qualification record →</a
				>
			</p>
		</div>
	</section>
	<section id="limits">
		<h2>Know the boundaries</h2>
		<div>
			<ul>
				<li>
					Astra pins Motion and motion-dom to 13.2.0, but Motion’s transitive dependencies use
					ranges. Consumer apps currently need the overrides in the installation guide to keep one
					qualified engine instance. Layout projection uses undocumented exports; upgrades need
					compatibility testing.
				</li>
				<li>
					Strict dependency type checks currently hit an upstream Motion declaration that references
					a missing <code>HTMLWebViewElement</code>. The checked consumer uses
					<code>skipLibCheck: true</code>; projects requiring <code>skipLibCheck: false</code> need an
					upstream fix.
				</li>
				<li>
					Large animated layouts are expensive. A recorded 500-participant workload is slow under
					CPU throttling, even with explicit layout transactions.
				</li>
				<li>
					Advanced drag constraints, drag-based reorder and full Motion React API parity are outside
					the current surface.
				</li>
				<li>
					Complex transformed ancestors, 3D layouts and every sticky or clipping combination have
					not been qualified.
				</li>
			</ul>
			<p>
				<a href={resolve('/docs/[slug]', { slug: 'troubleshooting' })}
					>Troubleshoot a specific interaction →</a
				>
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
					>Report an issue on GitHub →</a
				>
			</p>
		</div>
	</section>
</ProjectArticle>
