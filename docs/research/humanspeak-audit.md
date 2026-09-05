# Humanspeak Svelte Motion audit

Reviewed 2026-09-05 at commit [`15fd44ffeaa1a0905111d320ce9ff8e219c429cb`](https://github.com/humanspeak/svelte-motion/tree/15fd44ffeaa1a0905111d320ce9ff8e219c429cb), committed 2026-09-03. Package version is `@humanspeak/svelte-motion@1.1.0`. The isolated checkout is `/tmp/astra-humanspeak-review`. Dependencies were installed there with `pnpm install --ignore-scripts --frozen-lockfile --filter @humanspeak/svelte-motion...`; nothing from that project was installed into Astra. The checked lockfile resolves Svelte 5.56.10, SvelteKit 2.70.3 and Motion DOM 13.2.0. License: [MIT](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/LICENSE).

## Conclusion

This is relevant architectural prior art with real engineering behind it and reproducible defects. Neither its defects nor its broad feature claims establish how its code was authored. It would be inaccurate to dismiss its current implementation as a toy FLIP engine: it now uses Motion DOM VisualElements, animation state and projection nodes. We should retain our architecture and borrow integration lessons, without installing this library or copying its React-shaped public API.

Four small reproductions found three browser issues and one compiler correctness issue. These do not establish that every advertised feature fails. They explain why a long capability list and a large test suite are insufficient evidence of smooth, predictable composition.

## Architecture worth learning from

- **One VisualElement is the animation owner.** The component passes its existing VisualElement to the projection adapter; otherwise two instances could compete for the same DOM node and Motion's `visualElementStore`. This supports our decision to add targets and exits to the existing element integration. [Projection adapter](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/motionDomProjection.ts#L46-L71), [construction](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/motionDomProjection.ts#L189-L225).
- **Motion should arbitrate animation priority.** Its animation feature calls `createAnimationState`, and the exit feature activates the exit state. Hover/tap integration also feeds that state rather than independently writing transforms. We should reuse Motion's value tracking and animation state before adding our own priority system. [Animation and exit features](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/visualElementCore.ts#L79-L254).
- **Resolve the starting appearance explicitly.** `makeLatestValues` separates initial target resolution from browser mounting, including variant inheritance, `initial: false`, keyframe selection and `transitionEnd`. These are important SSR/first-frame semantics. The helper is a port of upstream behavior; its existence does not mean the entire SSR path is qualified. [Initial-value resolution](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/visualElementCore.ts#L325-L419).
- **Real-node presence is materially better than clone exits.** A newer `present` + owned-snippet path retains the actual node. The older children API animates clones and has fundamentally different behavior for media, events and state. Our native Svelte outro path avoids maintaining these two implementations. [Presence API](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/components/AnimatePresence.svelte#L12-L48).
- **Imports alone do not make integration stable.** The adapter imports root-exported `HTMLProjectionNode` and `HTMLVisualElement`, then accesses projection internals. Like our adapter, it needs compatibility tests. Its package permits compatible-range Motion upgrades rather than pinning the exact tested engine. [Package dependencies](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/package.json#L146-L150).

Its main `_MotionContainer.svelte` is 3,190 lines, the projection adapter 860, and its VisualElement foundation 523. Line count alone is not a quality metric, but the container mixes many responsibilities. We should keep lifecycle, state, projection and optional gestures separable.

## Browser-reproduced findings

Fresh real Chromium, Vitest browser provider, no mocked layout or Web Animations API. The tests assert that the undesirable behavior occurs; their passing status confirms the reproduction, not correctness of the library. These are focused component tests, not a full run of the upstream suite. No application production build or dev-server command was run.

| Finding                            | Reproduction and actual result                                                                                                                                                                                                                                  | Consequence                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Idle shared-layout measurement     | Mount 10 static `layoutId` elements, settle for 300 ms, count `Element.getBoundingClientRect` calls for 250 ms: **150 reads**.                                                                                                                                  | Shared elements continuously read geometry even when nothing changes.                           |
| Deep ancestor layout change missed | Place `layout` below seven ordinary DOM ancestors inside a 500 px flex row; change its ancestor's `justify-content` with a 1 s transition configured. After 50 ms, the node has moved **0 → 460 px**, has an empty inline transform and zero native animations. | The element jumps to the destination instead of projecting from the previous position.          |
| Media exit skipped                 | Put a canvas inside the ordinary conditional-children `AnimatePresence` API with a 1 s opacity exit; toggle off.                                                                                                                                                | Canvas and clone are both absent immediately after Svelte's update. There is no exit animation. |

The idle-read source is an unconditional per-element RAF loop for each `layoutId`. It calls `measureRect`, which writes the transform, reads the rect and restores the transform. The 150 reads correspond to ten elements on approximately fifteen frames; this is measured read frequency, **not** a measured count of forced-layout events or CPU duration. Legacy presence also maintains a separate per-element RAF loop, although its geometry reads are conditional on active/recent native animations. [Loops](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/html/_MotionContainer.svelte#L701-L767), [measurement helper](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/layout.ts#L366-L405).

The deep-ancestor failure follows from the explicit `MAX_OBSERVED_ANCESTORS = 4` limit. The fixed-size ancestors in the reproduction do not resize, so ResizeObserver cannot rescue the missing position-only invalidation. A bounded observation strategy is reasonable only when its contract acknowledges the lost changes. [Limit](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/layout.ts#L65-L73), [ancestor wiring](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/layout.ts#L759-L810).

The canvas behavior is an intentional fallback, not an accidental missing branch. The same check covers iframe, video and audio. It prevents visibly broken clones by removing immediately, but does not fulfill the requested exit semantics. The owned-snippet API is a separate possible solution in that library; we did not test that path here. [Media detection](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/presence.ts#L108-L123), [exit bypass](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/utils/presence.ts#L839-L846).

## Executed compiler reproduction

The optional Vite optimizer changes string contents:

```svelte
<script>
	import { motion } from '@humanspeak/svelte-motion';
	const literal = '<motion.div>example</motion.div>';
</script>

<motion.div>{literal}</motion.div>
```

The output changes the literal to `'<SvelteMotionDiv>example</SvelteMotionDiv>'`. This changes application data. Its Acorn-based script-reference handling does not prevent this because the template substitutions already run over the entire source string. The transform also returns `map: null`. This was reproduced by directly executing its exported plugin, not inferred from regex usage alone. [Whole-file template replacement](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/vite.ts#L341-L369).

This is evidence for using Svelte's structured AST and source maps when we ship compiler syntax. It is not evidence that preprocessing is inherently unsuitable.

## Testing and remaining uncertainty

The repository has substantial unit and end-to-end coverage. Its default Vitest environment is jsdom with fake timers and a WAAPI stub that reports immediate completion. Some tests called “SSR styles” mount into jsdom through Testing Library; those cases do not execute Svelte's server renderer. Its checked Playwright configuration enables Chromium while the other engines are commented out. These observations qualify what those particular tests establish; they do not prove that SSR or other browsers are broken. [Vitest configuration](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/vitest.config.ts#L32-L38), [WAAPI stub](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/vitest.setup.ts#L79-L110), [SSR-labelled tests](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/src/lib/html/_MotionContainer.ssr.spec.ts#L1-L30), [browser configuration](https://github.com/humanspeak/svelte-motion/blob/15fd44ffeaa1a0905111d320ce9ff8e219c429cb/playwright.config.ts#L44-L65).

We did not qualify its drag, gesture interruption, SSR hydration, route transitions, mobile behavior or the entire shared-layout matrix. We should not turn this focused audit into a claim that all of those fail.

## Reproducing the audit

Our authored fixtures, configuration, compiler input/output and recorded measurements are stored in [humanspeak-reproduction](./humanspeak-reproduction). They use `.txt` suffixes to stay outside Astra's compilation and test discovery.

1. Clone the repository into `/tmp/astra-humanspeak-review` and check out the exact commit above.
2. Install its locked root dependencies with scripts disabled using the command in the introduction; run `pnpm exec svelte-kit sync` to create its expected TypeScript configuration.
3. Copy the archived files to `audit/Harness.svelte`, `audit/failures.spec.ts`, `audit/compiler-repro.ts` and root `audit.vitest.config.ts`, removing `.txt`. The configuration imports Astra's already installed browser provider by absolute path; adjust that one path for another workspace.
4. Run `pnpm exec vitest run --config audit.vitest.config.ts --update`. The assertions confirm the three reproduced behaviors; generated snapshots record machine-dependent idle read counts and the geometry result.
5. Run `pnpm exec tsx audit/compiler-repro.ts` to reproduce the literal rewrite.

The isolated Svelte fixture was checked with the official Svelte autofixer: no issues or suggestions.

## Implications for Astra's next implementation

1. Add state and transform-aware exits to our existing VisualElement; never create a second animation owner for the same element.
2. Reuse Motion's target resolution/value animation machinery. Keep Svelte's real-node outro lifecycle.
3. Keep our shared frame scheduling and cached snapshots. Do not introduce continuous per-element geometry polling to make shared handoff work.
4. Test cross-component changes through ordinary unregistered DOM ancestors; do not assume a fixed ancestor depth covers real UI-library composition.
5. Include actual server rendering/hydration and real-browser intermediate-frame assertions alongside type checks and DOM tests.
6. If compiler syntax follows, transform markup nodes structurally and preserve literal text, comments and mappings.

The audit supports continuing the Motion DOM adapter rather than replacing it with this dependency or building a new animation engine.
