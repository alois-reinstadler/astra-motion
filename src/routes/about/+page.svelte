<script lang="ts">
	import { resolve } from '$app/paths';
	import ProjectArticle from '$lib/site/ProjectArticle.svelte';
</script>

<ProjectArticle
	eyebrow="WHY ASTRA"
	title="Motion, at home in Svelte."
	intro="A panel opens. Its neighbors move aside. A card becomes a detail view. Astra connects Motion’s animation engine to the Svelte code that already owns those changes."
>
	<section>
		<h2>Keep the element.</h2>
		<div>
			<p>
				Start with an ordinary button, section or list item. Use motion.button, motion.section or
				motion.li to render that same native element. Add a createMotion binding when existing
				markup owns it. Your CSS still determines its layout. Your Svelte state still determines
				what appears.
			</p>
			<p>
				The adapter handles the work between those two things: initial styles during server
				rendering, updated animation targets, and cleanup when the component goes away.
			</p>
			<p>
				<a href={resolve('/docs/[slug]', { slug: 'getting-started' })}
					>Build your first animation
				</a>
			</p>
		</div>
	</section>
	<section>
		<h2>Let exits finish.</h2>
		<div>
			<p>
				Astra uses Svelte’s native outro lifecycle to keep an outgoing element in the DOM until its
				exit animation finishes.
			</p>
			<p>
				For a changing view, Presence can wait for the old content to leave or let both views
				animate together. The same ownership holds when a parent branch disappears.
			</p>
			<p>
				<a href={resolve('/docs/[slug]', { slug: 'presence' })}>See how exits are coordinated </a>
			</p>
		</div>
	</section>
	<section>
		<h2>Keep Motion at the center.</h2>
		<div>
			<p>
				Motion supplies springs, animation values, gestures and layout projection. Astra connects
				them to Svelte attachments and reactivity. That keeps the library focused on the framework
				integration.
			</p>
			<p>
				Layout projection follows ordinary changes to your interface. A shared ID connects an
				element across two local layouts. For SvelteKit navigation, a separate route adapter uses
				the browser’s View Transitions API.
			</p>
			<p>Astra is an independent project, with no official affiliation to Motion or Svelte.</p>
			<p><a href={resolve('/showcase')}>Try the Fieldwork photo studio </a></p>
		</div>
	</section>
	<section>
		<h2>When Astra helps.</h2>
		<div>
			<p>
				Use Astra when animation needs to follow reactive targets, interrupted layout changes or
				coordinated exits across a Svelte interface. For a simple fade or slide, Svelte’s built-in
				transitions may be all you need. Motion’s vanilla API also works well for an isolated
				sequence.
			</p>
			<p>
				The current beta pins Motion because layout projection uses undocumented upstream exports.
				Check the supported scope and known limits before adopting it.
			</p>
			<p><a href={resolve('/status')}>Read the project status </a></p>
		</div>
	</section>
</ProjectArticle>
