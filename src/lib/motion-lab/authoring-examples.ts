/** The guide and compiler smoke tests consume the same complete component sources. */
export const authoringExamples = [
	{
		id: 'motion-component',
		title: 'Tag components in a keyed list',
		lab: '/motion-lab/state',
		summary:
			'Each tag component renders its named HTML element and includes its native exit transition.',
		note: 'A shared layoutGroup connects local layout IDs. Motion options belong in motion; native attributes, event handlers and CSS style stay on the component.',
		source: `<script lang="ts">
  import { motion, MotionConfig, createLayout } from 'astra-motion';
  let items = $state([1, 2, 3]);
  const group = createLayout();
</script>

<MotionConfig transition={{ duration: 0.24 }}>
  <ul>
    {#each items as item (item)}
      <motion.li motion={{
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        layout: true,
        layoutGroup: group
      }}>
        <button onclick={() => (items = items.filter((value) => value !== item))}>
          Remove item {item}
        </button>
      </motion.li>
    {/each}
  </ul>
</MotionConfig>`
	},
	{
		id: 'state',
		title: 'State & presence',
		lab: '/motion-lab/state',
		summary: 'A tag component includes SSR styles, an animation binding and native exit retention.',
		note: 'Use ordinary if and keyed each blocks. Motion durations are seconds; Presence is only needed for wait sequencing.',
		source: `<script lang="ts">
  import { motion } from 'astra-motion';
  let open = $state(true);
</script>

<button onclick={() => (open = !open)}>Toggle</button>
{#if open}
  <motion.section motion={{
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.24 }
  }}>Still a section.</motion.section>
{/if}`
	},
	{
		id: 'native-binding',
		title: 'Keep existing native markup',
		lab: '/motion-lab/state',
		summary:
			'Use createMotion when native directives, scoped selectors or an existing component own the markup.',
		note: 'Spread binding.props for SSR styles and its attachment, merge authored style after the spread, and add the native transition for exit. One binding owns one mounted element.',
		source: `<script lang="ts">
  import { createMotion } from 'astra-motion';
  let open = $state(true);
  const panel = createMotion({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  });
  const enterExit = panel.transition;
</script>

<button onclick={() => (open = !open)}>Toggle</button>
{#if open}
  <section {...panel.props} style={'color: steelblue;' + panel.props.style} transition:enterExit>
    Existing native markup.
  </section>
{/if}`
	},
	{
		id: 'form-bindings',
		title: 'Bind form values and native refs',
		lab: '/motion-lab/state',
		summary:
			'Tag components forward native attributes and events and implement supported Svelte bindings.',
		note: 'Use bind:ref for the actual DOM element. bind:group, media bindings and readonly dimensions still use native markup with createMotion.',
		source: `<script lang="ts">
  import { motion } from 'astra-motion';
  let name = $state('');
  let enabled = $state(true);
  let input = $state<HTMLInputElement | null>(null);
</script>

<label for="motion-name">Name</label>
<motion.input id="motion-name" name="name" bind:value={name} bind:ref={input}
  motion={{ whileFocus: { scale: 1.02 } }} />
<label for="motion-enabled">Enable notifications</label>
<motion.input id="motion-enabled" type="checkbox" bind:checked={enabled} />
<motion.button type="button" disabled={!enabled} onclick={() => input?.focus()}
  motion={{ whileTap: { scale: 0.98 } }}>Focus name</motion.button>
<p>{name || 'Your name'}: {enabled ? 'enabled' : 'disabled'}</p>`
	},
	{
		id: 'layout',
		title: 'Automatic layout',
		lab: '/motion-lab/updates',
		summary:
			'Change ordinary state. CSS chooses the destination; the shared projection scheduler animates it.',
		note: 'layout.update(() => change()) explicitly captures fresh geometry before a synchronous change. Automatic observation normally makes it unnecessary.',
		source: `<script lang="ts">
  import { createLayout } from 'astra-motion';
  const layout = createLayout();
  let wide = $state(false);
</script>

<button onclick={() => (wide = !wide)}>Resize</button>
<article style:width={wide ? '100%' : '65%'} {@attach layout()}>
  <div {@attach layout({ mode: 'position' })}>
    <h2>Text keeps its proportions.</h2>
    <p>An existing content host compensates for the surface scaling.</p>
  </div>
</article>

<style>
  article { padding: 24px; background: #ecebe5; border-radius: 16px; }
</style>`
	},
	{
		id: 'wait',
		title: 'Wait for the outgoing branch',
		lab: '/motion-lab/presence',
		summary:
			'Presence renders the latest requested value after the whole outgoing Svelte transition group finishes.',
		note: 'No wrapper is added. The value determines branch identity; child transitions determine retention. mode="sync" mounts the replacement immediately. onExitComplete runs after all outgoing branches finish.',
		source: `<script lang="ts">
  import { Presence, presence } from 'astra-motion';
  let chapter = $state(1);
  let completed = $state(0);
</script>

<button onclick={() => chapter++}>Next chapter</button>
<Presence value={chapter} onExitComplete={() => completed++}>
  {#snippet children(current)}
    <h2 transition:presence={{ duration: 240 }}>Chapter {current}</h2>
  {/snippet}
</Presence>
<p>Completed replacements: {completed}</p>`
	},
	{
		id: 'pop',
		title: 'Remove from flow, finish the exit',
		lab: '/motion-lab',
		summary:
			'popLayout captures the exiting element, frees its space, and lets projected siblings reflow immediately.',
		note: 'The direct parent must be positioned. The retained item needs a native outro. Use a per-item component if each item also needs its own createMotion binding.',
		source: `<script lang="ts">
  import { createLayout } from 'astra-motion';
  import { popLayout, presence } from 'astra-motion';
  const layout = createLayout();
  let items = $state(['Alto', 'Brio', 'Coda', 'Dune']);
</script>

<div class="list">
  {#each items as item (item)}
    <button {@attach layout()} {@attach popLayout()}
      transition:presence={{ duration: 240 }}
      onclick={() => (items = items.filter((name) => name !== item))}>
      {item} ×
    </button>
  {/each}
</div>

<style>
  .list { position: relative; display: grid; gap: 12px; }
  button { padding: 16px; text-align: left; }
</style>`
	},
	{
		id: 'shared',
		title: 'Shared elements & isolated groups',
		lab: '/motion-lab',
		summary:
			'A controller is a layout group. Local IDs pair different nodes within that group, including across components.',
		note: 'Pass a controller to children, or use the same explicit group ID across controllers to share a scope. Unnamed controllers are isolated. Reuse an element ID only for deliberate shared handoff.',
		source: `<script lang="ts">
  import { createLayout } from 'astra-motion';
  const tabs = createLayout({ id: 'product-tabs' });
  const labels = ['Overview', 'Details', 'Materials'];
  let selected = $state('Overview');
</script>

<nav aria-label="Product sections">
  {#each labels as label (label)}
    <button aria-pressed={selected === label} onclick={() => (selected = label)}>
      {label}
      {#if selected === label}
        <span {@attach tabs({ id: 'underline' })}></span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  nav { display: flex; gap: 24px; }
  button { position: relative; padding: 12px 0; }
  span { position: absolute; inset: auto 0 0; height: 3px; background: currentColor; }
</style>`
	},
	{
		id: 'inheritance',
		title: 'Coordinated children, including SSR',
		lab: '/motion-lab/inheritance',
		summary:
			'parent.child() declares variant ancestry before any DOM exists. Motion resolves trajectories; Svelte owns outro retention.',
		note: 'The child must mount inside its declared parent. Add |global when a child transition must participate in removal of an enclosing block. initial: false skips the first intro.',
		source: `<script lang="ts">
  import { createMotion } from 'astra-motion';
  let open = $state(true);
  const panel = createMotion({
    initial: 'hidden', animate: 'visible', exit: 'hidden',
    variants: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    transition: { duration: 0.2, when: 'afterChildren', staggerChildren: 0.06 }
  });
  const title = panel.child({
    variants: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }
  });
  const panelExit = panel.transition;
  const titleExit = title.transition;
</script>

<button onclick={() => (open = !open)}>Toggle group</button>
{#if open}
  <section {...panel.props} transition:panelExit>
    <h2 {...title.props} transition:titleExit|global>One coordinated branch.</h2>
  </section>
{/if}`
	},
	{
		id: 'component',
		title: 'Your own component',
		lab: '/motion-lab/components',
		summary:
			'A custom component accepts a binding and forwards it to its real element. It imports only a type.',
		note: 'Save this as MotionCard.svelte, then pass motion={card} from a parent using createMotion(). The project’s shadcn Card, Dialog and Accordion implement this contract.',
		source: `<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { MotionBinding } from 'astra-motion';
  let {
    motion, ref = $bindable(null), style, children, ...attributes
  }: HTMLAttributes<HTMLElement> & {
    motion?: MotionBinding;
    ref?: HTMLElement | null;
  } = $props();
  const transition = (node: HTMLElement) => motion?.transition(node) ?? { duration: 0 };
  function forwardRef(node: HTMLElement) {
    ref = node;
    return () => { if (ref === node) ref = null; };
  }
</script>

<article {...attributes} {...motion?.props} {@attach forwardRef}
  style={(style ?? '') + ';' + (motion?.props.style ?? '')}
  transition:transition|global>
  {@render children?.()}
</article>`
	},
	{
		id: 'scroll',
		title: 'Scroll-linked motion',
		lab: '/motion-lab/scroll',
		summary:
			'Attach a container, optionally a target, and a linked animation. Motion selects its native or fallback scroll implementation.',
		note: 'With no container attachment, tracking uses the window. progress is a MotionValue for semantic UI; decorative linked motion settles when reduced motion is enabled.',
		source: `<script lang="ts">
  import { createScroll } from 'astra-motion';
  const reading = createScroll();
  const fill = reading.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
</script>

<div class="scroller" {@attach reading.container}>
  <div class="meter" {@attach fill}></div>
  <p>Scroll through this reading surface.</p>
</div>

<style>
  .scroller { position: relative; height: 220px; overflow: auto; }
  .meter { position: sticky; top: 0; height: 4px; background: coral; transform-origin: left; }
  p { min-height: 700px; padding: 24px; }
</style>`
	},
	{
		id: 'in-view',
		title: 'Observe viewport visibility',
		lab: '/motion-lab/presence',
		summary: 'Read reactive visibility without attaching an animation binding.',
		note: 'Call during component initialization. The target getter follows the attached element; current starts false on the server. once stops observing after entry and resets when the target changes.',
		source: `<script lang="ts">
  import { createInView } from 'astra-motion';
  let section = $state<HTMLElement>();
  const visibility = createInView(() => section, { amount: 0.5, once: true });
  function target(node: HTMLElement) {
    section = node;
    return () => { section = undefined; };
  }
</script>

<section {@attach target}>
  <h2>A section to discover</h2>
  <p>{visibility.current ? 'Seen at least halfway.' : 'Waiting to enter the viewport.'}</p>
</section>`
	},
	{
		id: 'timeline',
		title: 'Scoped timelines',
		lab: '/motion-lab/timelines',
		summary:
			'Selectors stay inside the attached root. Replaying an overlapping sequence replaces stale playback and cleanup follows the scope.',
		note: 'Use the returned controls for pause, play, time and speed. Do not give a timeline a node already owned by createMotion, layout or a scroll animation.',
		source: `<script lang="ts">
  import { createAnimate } from 'astra-motion';
  const scene = createAnimate();
  function play() {
    scene.sequence([
      ['.tile', { y: -24, opacity: 0.5 }, { duration: 0.2 }],
      'return',
      ['.tile', { y: 0, opacity: 1 }, { at: 'return', duration: 0.3 }]
    ]);
  }
</script>

<button onclick={play}>Play / replace</button>
<section {@attach scene.attach}>
  <div class="tile">Only this tile moves.</div>
</section>

<style>
  section { padding: 40px; }
  .tile { padding: 20px; background: #ecebe5; }
</style>`
	},
	{
		id: 'routes',
		title: 'Install route transitions once',
		lab: '/motion-lab/product',
		summary:
			'Call the coordinator in your persistent SvelteKit root layout. Kit owns navigation; native View Transitions capture the two pages.',
		note: 'This is +layout.svelte. Unsupported browsers and reduced-motion users navigate immediately. Install one coordinator, not one per page.',
		source: `<script lang="ts">
  import type { Snippet } from 'svelte';
  import { routeTransitions } from 'astra-motion/routes';
  let { children }: { children: Snippet } = $props();
  routeTransitions();
</script>

{@render children()}`
	},
	{
		id: 'route-shared',
		title: 'Shared identity across routes',
		lab: '/motion-lab/product',
		summary:
			'Use the same ID and scope on the list image and detail image. Temporary browser names are assigned only during navigation.',
		note: 'Use this component on both pages with the same product. The route coordinator above is required. Local layout IDs and route identities use separate backends.',
		source: `<script lang="ts">
  import { routeShared } from 'astra-motion/routes';
  let { product }: { product: { id: string; image: string; name: string } } = $props();
</script>

<img src={product.image} alt={product.name} width="640" height="480"
  {@attach routeShared(product.id, { scope: 'products' })} />

<style>
  img { display: block; width: 100%; height: auto; object-fit: cover; }
</style>`
	}
] as const;
