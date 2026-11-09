# Competitor-derived regression scenarios

Audited 21 October 2026 against Humanspeak Svelte Motion **2.1.1**, commit
[`f2b5d7666cb62767fc4a753391fc35da840f46a2`](https://github.com/humanspeak/svelte-motion/tree/f2b5d7666cb62767fc4a753391fc35da840f46a2).
The original MIT notice is preserved in [LICENSE.humanspeak](LICENSE.humanspeak).
These are selected adaptations, not an imported competitor suite or a claim of
complete parity. Astra remains on Motion/Motion DOM **13.4.4**.

| Reference                                                                                                                                                                            | Astra adaptation                                                 | Observable regression                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [`e2e/motion/hover-tap-disjoint-keys.spec.ts`](https://github.com/humanspeak/svelte-motion/blob/f2b5d7666cb62767fc4a753391fc35da840f46a2/e2e/motion/hover-tap-disjoint-keys.spec.ts) | `src/lib/motion-lab/competitor-gesture-ownership.svelte.spec.ts` | Hover enter/leave still changes opacity while a keyboard tap owns scale; releasing the tap restores scale without corrupting opacity.   |
| [`src/lib/html/_MotionContainer.ssr.spec.ts`](https://github.com/humanspeak/svelte-motion/blob/f2b5d7666cb62767fc4a753391fc35da840f46a2/src/lib/html/_MotionContainer.ssr.spec.ts)   | `src/lib/motion-lab/competitor-ssr-seeding.spec.ts`              | Absent/empty initial does not serialize animate-only styles; false initial uses final keyframes, including zero; explicit initial wins. |

## Adaptations

The gesture cases mount Astra's public `motion.button` in an actual browser.
Keyboard Space and synthetic mouse enter/leave events overlap independently,
avoiding pressed-pointer cancellation. Rendered scale **must already be 0.9**
before hover crosses the boundary, and must remain 0.9 while opacity changes.
This proves that the tap is active, rather than relying on a delay. Polling
observed styles replaces the reference's 200/800ms sleeps. Teardown unmounts the
component; the real mouse is parked before mounting to prevent test leakage.
These cases test gesture arbitration, not trusted-input delivery; existing
trusted-pointer and keyboard tests remain complementary.

The reference's SSR-named tests mount through Testing Library in jsdom. Astra's
adaptation uses `svelte/server`'s `render` in the Node project, verifies there is
no `document`, and checks serialized styles through the public `motion.div`.
Negative cases retain authored border radius as a positive control; an empty
render therefore cannot accidentally satisfy them. Positive controls exercise
first/last keyframes and custom CSS variables.

Other candidates were not blindly imported: Astra already tests engine identity,
frame disposal, real-frame geometry and interrupted layout. The competitor's
drag-release scenario names Motion 13.4.5, newer than Astra's engine; it is an
upgrade-audit candidate rather than an assumed 13.4.4 contract.

Run the SSR file with `pnpm exec vitest run --project server` and the gesture
file with `MOTION_BROWSER=chromium pnpm run test:browsers`, appending the desired
file path to each command. Browser configuration also supports Firefox/WebKit.
The ecosystem research record gives the audit scope and final verification.
