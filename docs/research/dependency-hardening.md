# Motion dependency hardening

Qualified on 2026-09-05 against the installed official packages: `motion@13.2.0`, `motion-dom@13.2.0`, resolved `framer-motion@13.2.0` and `motion-utils@13.0.0`. This is a pinned-version result, not a claim about every Motion release or the current upstream main branch.

The adapter uses official package-root exports. Some are documented vanilla APIs; projection, VisualElement, animation-state integration, and playback internals are exported but do not carry the same documented framework-adapter stability contract. Two private fields remain isolated in `src/lib/motion/motion-compat.ts`. Exact dependency pins and passing exports checks reduce accidental upgrades; they do not make those interfaces stable.

## Independent upstream reproductions

`tests/upstream-motion` is a plain HTML/TypeScript Vite harness. It imports only official Motion roots. It imports no Astra runtime, Svelte, React, compatibility shim, or dependency patch. `repros.ts` contains the three reproductions; `contracts.ts` separately checks the adapter's required engine shapes.

```sh
node scripts/check-motion-upgrade.mjs
pnpm exec tsc -p tests/upstream-motion/tsconfig.json
pnpm exec playwright test --config tests/upstream-motion/playwright.config.ts
```

The separate strict declaration reproduction is an intentionally failing release gate on the pinned version:

```sh
pnpm exec tsc -p tests/upstream-motion/tsconfig.declarations.json
```

It imports only `AnimationOptions` from the official vanilla `motion` root, with standard DOM libraries and `skipLibCheck: false`. Motion's resolved `framer-motion/dist/dom.d.ts:314` refers to the undeclared `HTMLWebViewElement` type. The normal consumer check uses `skipLibCheck: true` and cannot establish declaration correctness. This upstream declaration limitation remains unresolved; do not add an application-wide dummy global or report strict declarations as passing. Re-run the minimal case and packed-consumer declaration gate on upgrades.

Playwright owns an isolated server on `127.0.0.1:5194`, runs one worker, and closes the server afterwards. Run separately from performance measurements. For manual inspection from the repository root:

```sh
pnpm exec vite --config tests/upstream-motion/vite.config.ts
```

Open the printed local URL and use the three buttons. Reload between investigations if collecting allocation data: the scroll reproduction intentionally leaves upstream fallback listeners behind.

All 12 browser cases passed in **7.0 seconds**: four cases each in Chromium, Firefox and WebKit. “Passed” here means the pinned upstream behaviors were reproduced, including undesirable behavior. A changed result after an upgrade should trigger reassessment, not an attempt to preserve the defect.

| Reproduction                                                                                                          | Desired behavior                                                      | Observed in all three engines                                                        |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Finish native opacity, immediately call Motion playback `stop()` and `cancel()`, then assign opacity `0.75`           | New owner retains `0.75`                                              | Old endpoint `0.25` returns after two frames; zero active native animations remain   |
| Read one pending `AsyncMotionValueAnimation.animation` getter while an unrelated intrinsic-height animation is queued | Inspection does not measure the unrelated element                     | Unrelated `getBoundingClientRect()` count changes synchronously from 0 to 2          |
| Create and detach three scroll-linked playback controls with custom offsets                                           | Removed containers lose their scroll listeners                        | Timeline playback leaves 3 listeners; the two-argument information callback leaves 0 |
| Instantiate required public-root engine classes and inspect compatibility handles                                     | Required methods, shared stack, class identity and shim handles exist | No contract errors                                                                   |

These are deterministic behavioral characterizations, not performance benchmarks. The cancellation case uses the browser's `Animation.finish()` to enter the finished-before-event-delivery boundary without timing guesses. The getter test instruments only its unrelated fixture. Scroll instrumentation tracks actual add/remove calls on each container; it does not measure garbage collection or establish a byte count for retained memory.

### Why the native compatibility shim exists

In the installed native playback implementation, `stop()` returns early when already finished. Cancellation removes the native effect but does not disarm an already queued completion callback. That callback can still publish the old endpoint after another owner has written its style. The standalone reproduction needs only public Motion calls and standard browser APIs; the adapter regression suite additionally covers replacement MotionValue ownership and Svelte presence.

The adapter clears the existing native handle's `onfinish` before transferring ownership. It settles an already finished endpoint using Motion's endpoint/direction helpers where appropriate. Obtaining that handle currently requires `NativeAnimation.animation`, a protected field.

The apparent public alternative, `AsyncMotionValueAnimation.animation`, is not a passive inspection API. While unresolved, it flushes the shared keyframe-resolution queue. Reading it during ownership cleanup can therefore force unrelated layout measurements into that phase. The adapter inspects the existing private `_animation` field instead and leaves an unresolved animation unresolved. Both private accesses stay in one compatibility file; there are no deep imports or prototype patches. Relevant official source locations: [native playback](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/NativeAnimation.ts), [asynchronous playback](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/AsyncMotionValueAnimation.ts).

Prefer an upstream public, non-resolving playback inspection/cancellation API if one becomes available. Remove the shim when both standalone behavior and adapter handoff regressions prove it unnecessary. Switching to direct WAAPI would duplicate the playback machinery and still require correct ownership transfer.

### Why scroll uses an information callback

Motion's installed timeline path stores timelines in a container/target/offset cache. Its fallback owns a scroll subscription; detaching the animation does not release that subscription in this reproduction. Custom offsets force the fallback consistently across the engines.

The adapter uses Motion's two-argument scroll information callback, whose subscription cleanup releases its listeners, and connects progress to playback through `attachTimeline`. This retains Motion's measurement and playback code while giving Svelte a finite subscription lifetime. `attachTimeline` is another exported engine interface with upgrade risk. The callback's information argument is documented in the [official scroll API](https://motion.dev/docs/scroll).

An ordinary callback that also supplies a target or offset already selects Motion's information path in 13.2. The failure is not universal to all `scroll()` callbacks. The reproduction deliberately compares animation-controls attachment against the information callback; it does not falsely attribute retention to the latter.

## Repeatable upgrade gates

`scripts/check-motion-upgrade.mjs` is a read-only AST-based gate. Its reviewed baseline is `tests/upstream-motion/reviewed-exports.json`. The current result covers **28 source files, 5 Motion runtime exports, 42 Motion DOM runtime exports, and 64 type-import occurrences**.

It checks:

- Exact direct pins and qualified resolved versions, plus one shared `motion-dom` installation for the vanilla and adapter paths.
- Class, frame-scheduler and VisualElement-store identity across package roots. Duplicate engines can break `instanceof`, ownership and scheduling even if their exports look identical.
- Every named runtime Motion import/re-export in the motion source tree and root library entry against an explicit reviewed allowlist; every type import against the installed root declarations.
- No React, React DOM, Framer Motion direct import, Svelte Motion clone, or Motion deep/subpath import in the adapter. Computed module imports, dynamic Motion imports and wildcard/namespace Motion exposure require explicit review rather than slipping past the audit.
- No direct forbidden runtime dependency or configured Motion dependency patch. The script reads package metadata from disk after resolving public entries because `motion-dom/package.json` itself is not an exported subpath; it never imports internal implementation modules.

The browser contract adds instantiated VisualElement, projection/root/shared-stack, animation-state, scheduler, MotionValue and playback method/field checks, including `GroupAnimation.animations`, `attachTimeline`, `_animation`, and the underlying native `animation`. Optional projection state such as `isPresent` is assigned by the framework adapter and need not exist immediately after construction. Class construction is tested in the browser: importing the root is server-safe, but constructing the default DOM projection root requires a DOM.

These checks are tripwires, not a semantic compatibility proof. A method can retain its name and change its behavior. Keep the existing adapter tests as the behavioral authority rather than duplicating their coverage in the upstream harness:

| Risk                                                                                | Existing behavioral coverage                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Finished native event, pending resolution, JS stop versus cancel, ownership release | `src/lib/motion-lab/aftercare-motion-review.svelte.spec.ts`                                |
| WAAPI to Svelte exit/reversal                                                       | `src/lib/motion-lab/waapi-presence-review.svelte.spec.ts`, `presence-state.svelte.spec.ts` |
| Scoped stop/cancel, timeline sequencing and lifetime                                | `src/lib/motion-lab/scoped-animate.svelte.spec.ts`                                         |
| Scroll cleanup and reduced-policy lifetime                                          | `src/lib/motion-lab/scroll.svelte.spec.ts`, `scroll-aftercare-review.svelte.spec.ts`       |
| VisualElement state, variants and lite/full integration                             | `src/lib/motion-lab/motion-state.svelte.spec.ts`, `lite-state.svelte.spec.ts`              |
| Projection, shared layouts and route transitions                                    | Full motion unit/browser suite and `tests/motion/routes.spec.ts`                           |
| Consumer module identity, SSR, hydration and packaging                              | Packed production-consumer qualification                                                   |

Upgrade procedure:

1. Inspect the candidate's official package exports, declarations and relevant engine source. Change pins and the lockfile intentionally. Do not blindly regenerate the reviewed allowlist to silence a failure.
2. Run the static gate and isolated upstream/browser contracts. For a fixed upstream behavior, update its characterization with an explanation and test removing the corresponding adapter workaround.
3. Run the existing adapter suites across Chromium, Firefox and WebKit, plus SSR, route and packed-consumer qualification. Recheck interruption, stopped-pose ownership, shared IDs, scroll listener disposal and live reduced motion.
4. Repeat production bundle and exclusive performance measurements if scheduling, projection, exports or tree shaking changed. Compare measurements using the same browser/configuration and participant counts.
5. Commit the reviewed baseline, evidence and any remaining compatibility caveats together. Do not widen dependency ranges merely because the package-boundary check passes.

No upstream issues were sent or published as part of this work. The standalone harness is prepared for review or a future authorized upstream report.
