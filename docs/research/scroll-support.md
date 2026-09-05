# Scroll support

`createScroll` is Svelte lifecycle glue around the documented, framework-independent [`scroll`](https://motion.dev/docs/scroll) and [`animate`](https://motion.dev/docs/animate) APIs from official `motion@13.2.0`. It does not use React. Motion owns scroll measurements, interpolation and frame scheduling. Attachment-owned native `ScrollTimeline` instances accelerate simple container effects; target/custom-offset effects subscribe to the controller's MotionValue. This avoids a reproduced cache-lifetime issue in Motion 13.2.0; see [the soak report and API stability caveat](reliability-soak.md).

## Container and window progress

```svelte
<script lang="ts">
	import { createScroll } from 'astra-motion/scroll';
	import { motionStore } from 'astra-motion/values';

	const reading = createScroll();
	const progress = motionStore(reading.progress);
	const fill = reading.animate({ transform: ['scaleX(0)', 'scaleX(1)'] });
</script>

<p>{Math.round($progress * 100)}% read</p>
<div class="scroller" {@attach reading.container}>
	<div class="progress" {@attach fill}></div>
	<!-- content -->
</div>

<style>
	.scroller {
		position: relative;
		height: 400px;
		overflow: auto;
	}
	.progress {
		position: sticky;
		top: 0;
		height: 4px;
		background: coral;
		transform-origin: left;
	}
</style>
```

Omit the `container` attachment to follow document scroll. Use `createScroll({ axis: 'x' })` for a horizontal scroller. A controller has one container and one optional target, and can drive several visual attachments. Multiple controllers can share one container. All bindings stop when their component is destroyed; removing an attached container/target suspends its controller until remount.

The selected axis's `progress` is an ordinary MotionValue. It does not cause component rerenders unless subscribed through `motionStore`. It belongs to the controller and is destroyed with it. Motion's underlying event-based progress measurement uses its shared frame scheduler even when linked visual effects are native; this wrapper does not claim zero main-thread work.

## Target offsets

```svelte
<script lang="ts">
	import { createScroll } from 'astra-motion/scroll';
	const section = createScroll({ offset: ['start end', 'end start'] });
	const reveal = section.animate({ opacity: [0.2, 1], y: [40, 0] });
</script>

<section {@attach section.target}>
	<div {@attach reveal}>Content entering the viewport</div>
</section>
```

Keep the measurement target separate from its animated content for the clearest authoring model. Offsets retain Motion's documented meaning. Motion handles target geometry and offset measurement. Target effects use the shared progress fallback. CSS should handle pinning with `position: sticky`.

A reactive reader updates options without recreating the controller:

```ts
const section = createScroll(() => ({
	axis: horizontal ? 'x' : 'y',
	reducedMotion: reduced ? 'always' : 'user'
}));
```

`container` and `target` can also be supplied as elements in the options. An attachment takes precedence for its corresponding element.

## Reduced motion and ownership

The factory inherits `MotionConfig.reducedMotion`, follows live OS changes, and accepts an explicit override. Linked visual effects finish immediately under reduced motion; semantic progress keeps tracking. Re-enabling motion reconnects effects at the current scroll position. A direct controller subscription also settles active links when an OS/config change arrives during a native Svelte outro, while its attachment effects are paused. A scroll progress indicator therefore appears complete under the default reduced policy. If that indicator must remain exact, bind its progress through a MotionValue/CSS property intentionally, separately from decorative motion.

The `.animate` attachment claims ownership of its element. It diagnoses concurrent state/layout/timeline owners and refuses decomposed transform animation on an element with an authored transform. To compose scroll with layout, map `scroll.progress` into an existing `createMotion({ style: ... })` binding rather than attaching a second visual owner. External MotionValue mappings remain caller-controlled: use `scroll.reducedMotion` to choose a stable transform when reducing motion.

Cleanup cancels the scroll binding, stops its animation, restores only the inline properties it owned, and releases ownership. Motion's JS cancellation can leave one scheduled style render. A single shared-scheduler post-render cleanup restores after it, guarded against a new animation owner. Changes to unrelated application styles are preserved. Direct writes to the same owned properties during an active attachment are unsupported.

## Scope and limitations

- `createScroll` must be called during component initialization, because its effects belong to that component. No browser APIs run during SSR.
- Scroll effects start on mount. The attachment does not invent SSR initial styles. Author a useful static CSS baseline; this is separate from `createMotion.props`, which supports SSR animation targets.
- Animation options are Motion options, with linear one-second defaults suitable for scrubbing. Repeats are excluded from the typed scroll animation options.
- Pinned Motion 13.2.0's public `ScrollOptions` does not expose the newer documentation's `trackContentSize` option. Changes in scrollable content may need a subsequent scroll/resize event for fallback measurement. We do not silently add an observer engine to emulate a newer dependency.
- Scrolling is driven by the browser and Motion. This does not add scroll smoothing, custom pinning, virtual scrolling or a new animation clock.
- Ordinary reactive option rebinding follows Svelte attachment effect timing, so it pauses during a retained native outro. Reduced-motion intervention bypasses that pause; destruction always cancels the links.
- Browser-native acceleration applies to supported properties with simple container/document ranges and browser support. Target/custom-offset effects currently use the fallback. Functional fallback behavior is tested independently from claims of hardware acceleration.

## Lab and verification

Open `/motion-lab/scroll`: container progress, target reveal, horizontal scrolling, direction reversal, changing content, vertical resize, reduced motion, and conditional unmount/remount.

Focused browser tests cover exact half/end/start progress, reverse direction, target offsets, horizontal tracking, reduced-policy changes, removed-node animation cleanup, suspended tracking and remount. A server test renders the lab without `document` and checks that no attachment-only transform is invented in the HTML. Eight focused cases pass in each of Chromium, Firefox and WebKit (24 browser cases), plus the SSR case. The browser suite asserts the actual native `ScrollTimeline` when the browser exposes it, tests resize and twelve direction reversals, and includes inherited-policy and OS-change events during a retained native outro. The OS event test uses a controlled `MediaQueryList` change event; it does not claim system-settings UI automation.

Independent review caught and fixed raw-transform ownership checks, cleanup when linking throws, and live reduced-motion handling during retained outros. Native-path tests also exposed an adapter bug: `autoplay: false` left Chrome/WebKit native scroll animations paused. Linking now follows Motion's documented usage: start animation and attach the scroll timeline synchronously. Cancellation occurs before timeline detachment, avoiding an upstream stop sample at an unrelated wall-clock endpoint.

Logs: `/tmp/astra-scroll-{chromium,firefox,webkit,server}.log`. Manual Chrome inspection: `/tmp/astra-scroll-lab.png`; the initial rendered lab had no page errors. `svelte-check` passed with zero errors/warnings before final retention additions; final project validation is recorded by the orchestrator.

The later [100-cycle reliability soak](reliability-soak.md) supersedes the original scroll lifetime implementation and extends these checks across all three engines. It fixed an upstream cached-timeline lifetime issue without changing the public Svelte API.
