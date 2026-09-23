<script lang="ts">
	import Mistake from '$lib/Mistake.svelte';
	import { createMotion } from 'astra-motion';
	let kind = $state('member');
	const before = createMotion({ initial: { opacity: 0.2 }, animate: { opacity: 1 } });
	const after = createMotion({ initial: { opacity: 0.2 }, animate: { opacity: 1 } });
</script>

<h1>Novice and refactor probes</h1>
<button id="repeat" onclick={() => (kind = 'repeat')}>Reuse binding</button><button
	id="css"
	onclick={() => (kind = 'css')}>Fade transformed element</button
><button id="member-test" onclick={() => (kind = 'member')}>Direct transition member</button>
{#key kind}<svelte:boundary>
		<Mistake {kind} />{#snippet failed(error)}<p id="caught">{String(error)}</p>{/snippet}
	</svelte:boundary>{/key}
<div id="style-before" {...{ style: 'padding:24px' }} {...before.props}>Authored style before</div>
<div id="style-after" {...after.props} style="padding:24px">Authored style after</div>
