# Independent Svelte compiler and lifecycle review

Reviewed the runtime written by the orchestrator/Motion agent, not this reviewer's route adapter. Scope: native presence, wait sequencing, attachment lifecycle, projection registration timing and the optional compiler spike. Exact installed Svelte: 5.57.0. Findings reflect the files as inspected; concurrent fixes are identified separately.

## Findings requiring action

### S1 — Wait presence silently stalled without a retained root — fixed

**Classification:** implementation/API bug. **Priority:** high.

The reviewed `Presence.svelte` advanced `current` only from the teardown returned by its `retain` attachment. If a consumer omitted the attachment, or the first snippet rendered no element, that teardown never existed. Changing `value` hid the old branch and left it empty indefinitely. Both cases were reproduced in independent browser tests before the fix.

The snippet type cannot require a consumer to use the second argument, so TypeScript does not diagnose the mistake. Requiring a stable retained root is a substantial authoring contract for a supposedly first-class wait primitive.

**Resolution:** after orchestrator approval, implemented `PresenceBranch.svelte`, an internal wrapperless snippet-rendering component whose `onDestroy` notifies Presence. Its lifecycle exists even when the snippet renders nothing. The public API is now `children(value)` with no retain attachment or event callback. All five independent browser tests pass, including advancing from empty content and sequencing ordinary content without lifecycle wiring. This was an architectural API simplification, not merely a warning added around the failure.

### S2 — popLayout loses CSS declaration priority on restoration

**Classification:** implementation bug. **Priority:** medium.

`popLayout` saves only `style.getPropertyValue`, then restores declarations without their original `!important` priority. A consumer's `width: 100px !important` or positioning declaration changes meaning after reversal/cleanup. The projection adapter now records value and priority together; presence should do the same. This finding is source-proven, not a browser reproduction.

### S3 — Flow restoration and projection reversal need a joint test

**Classification:** lifecycle/performance risk, not yet a proven defect. **Priority:** high verification requirement.

popLayout restores document flow on `introstart`. In installed Svelte, that event happens after a dummy WAAPI animation used for transition delay. An explicit `layout.update` reversal may therefore measure the destination while the previously exiting element is still absolute. The final geometry and sibling interruption need an adversarial test reversing a popped item while siblings are projecting. Reported to the orchestrator for browser review; do not describe reversal of ordinary opacity presence as proof of popLayout reversal.

The stale geometry fallback also assumes layout changes pass through `layout.update`. Without it, popLayout can reuse the geometry from a prior exit after reversal because reset does not clear the cached box. The public API must state this transaction requirement.

### S4 — Deferred registration changes error delivery

**Classification:** API/lifecycle limitation. **Priority:** medium.

The revised projection adapter materializes pending nodes in a raw `queueMicrotask`. A transform-ownership validation error inside that callback is outside Svelte's managed effect execution. Do not assume a `<svelte:boundary>` captures it. Keep validations that can happen during the attachment's own invocation there, or expose/document an explicit diagnostic mechanism. Projection construction failure should also not abandon unrelated pending registrations with partial state.

## Findings resolved by the architecture

### Group completion belongs to destruction, not an individual outro event

Installed `pause_effect` collects participating transition managers and destroys the block only after all complete. `destroy_effect` removes the DOM and then destroys child effects. The root's own `outroend` can happen substantially earlier than a descendant's. Lifecycle destruction is therefore the correct completion boundary. The final wrapperless internal component keeps that boundary without requiring an attached DOM root.

Executed independent Chromium cases in `ReviewPresence.svelte` and `review-presence.svelte.spec.ts`:

- Outer outro 40 ms, nested local outro 300 ms: at 110 ms the outgoing root is still the same DOM node; the next value appears only after group completion.
- Reverse selection before the nested outro finishes: the original root is resumed rather than remounted.
- Change the requested value again during exit: only the latest requested value mounts.
- Dispose the parent during exit: completion does not resurrect content.

Initial intros must settle before the first two assertions. Otherwise Svelte correctly reverses an almost-unstarted intro and the outro completes quickly; that is not a retention failure.

Final run: **5 Chromium tests passed**, approximately 4.1 seconds of test execution. Tests now assert correct behavior for S1. The two runtime components and two fixtures pass Svelte autofixer with zero issues and zero suggestions and pass targeted ESLint.

Local transitions work for ordinary root/descendant elements in the child snippet. If a consumer introduces another `{#if}` block around those elements, its local transitions naturally belong to that inner block and do not participate in the outer Presence removal. Use `transition:presence|global` for that case, as demonstrated by `ReviewEmptyPresence.svelte`. This is Svelte's normal local/global contract, not a new library rule. An initial experiment that removed `|global` while leaving the extra inner conditional correctly skipped those transitions; the final tests distinguish the two structures.

### Attachment pre-effects are not a commit barrier

The earlier independent lifecycle test remains decisive: component pre-effect sees width 100/order `ab`; attachment pre-effect sees width 100/order `ba`; post-effect sees width 200/order `ba`. The explicit transaction API avoids depending on this mixed snapshot. Cached committed geometry has only been proved for a narrow measurement fixture, so refusing to market it as a complete projection backend is correct.

### Parent-first projection materialization is necessary

Svelte attachment effects can initialize descendants before ancestors. A projection adapter that searches only already-registered DOM ancestors can therefore create sibling projection roots accidentally. The Motion agent's pending-registration queue and DOM-order materialization address this case. Shared replacements mount before departing shared-stack members are disposed, which preserves handoff data. Dynamic reparenting of an already-mounted participant and ancestor-only attachment replacement still require explicit testing; sorting newly pending nodes alone does not rebuild an existing child's parent relationship.

## Compiler review

The transform uses Svelte's modern parser to select structured AST attributes and MagicString offsets to preserve untouched source. It does not regex-rewrite Svelte. Identifier discovery includes script, module and snippet scopes. Unsupported component/foreign-element/transition/spread cases fail explicitly. Existing attachments and script forms are preserved. These are good boundaries for an isolated research spike.

Executed `pnpm exec vitest run --project server src/lib/motion-lab/compiler.spec.ts`: **26 tests passed**, including client/SSR/HMR compiler modes, TypeScript scripts, module scripts, snippets/render tags, existing attachments, conflict rejection, idempotence and source-map metadata.

Those tests do not prove these stronger claims:

- HMR compilation success does not prove browser HMR disposal/re-registration.
- Having nonempty source-map mappings does not prove generated error positions map to the correct original expression.
- Svelte compile accepts unresolved imports; these tests do not resolve the generated package import or check its editor types.
- A preprocessor alone does not teach svelte-check or the language server about new DOM attributes.
- Generated private controllers do not intercept application mutation boundaries. The emitted attachment therefore does not make bare `layout` automatically animate arbitrary updates.

Because the spike is neither exported nor enabled in Vite, these are acceptable research limitations. It should remain optional and unshipped until it improves ergonomics without concealing the explicit update contract.

## SSR, HMR, typing and API limits

The reviewed presence component performs no DOM reads during server rendering; its initial current value is deterministic. Attachments initialize in browser effects. Context-independent controller creation is safe on the server, and controller instance counters are not rendered into server HTML. The attachment feature's peer Svelte minimum needs to cover the attachment API.

Runtime options passed directly to an attachment factory can cause teardown and recreation when reactive values change. Recreating a projection participant discards its ongoing state; documentation must not imply in-place retargeting for reactive configuration unless a getter/update API is implemented. Distinguish changing layout through `layout.update` from replacing attachment configuration.

Two additional Node tests in `review-presence.spec.ts` render the real components through `svelte/server`, confirming deterministic initial HTML without browser globals and safe empty snippets after server destruction microtasks. No actual browser HMR experiment or SSR hydration screenshot is part of this review. The compiler check and server rendering cannot establish absence of an initial transform flash. The Motion adapter explicitly rejects application transforms outside its owned pipeline; it must continue to present transformed unregistered ancestors and dynamic CSS transforms as unsupported, rather than claiming universal transform composition.

## Recommendation

Keep the explicit transaction plus native presence architecture as a prototype. The public retained-root requirement has been removed using a verified wrapperless internal branch component. Preserve declaration priorities and obtain a popLayout reversal test before making a broader correctness claim. The compiler spike earns continued investigation but not public API status.
