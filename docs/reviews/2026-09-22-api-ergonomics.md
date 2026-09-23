# Adversarial API ergonomics review

Reviewed **2026-09-22**, Astra **0.0.1**, main **`ab801d65283e55b4cd34d509960805995cd81b0f`**. A fetch confirmed local main and origin/main agreed. Production APIs and dependencies were unchanged during this review. The later approved changes are recorded in the [implementation follow-up](2026-09-22-api-ergonomics/implementation.md).

The subsequent [binding and lifecycle follow-up](2026-09-22-api-ergonomics/bindings-and-lifetimes.md) records the user's native-binding requirement and effect preference, a bounded `motion.input` prototype, and the implications of Svelte issues #8547 and #16648.

## Verdict

**Astra earns its existence as a Svelte integration, but the current authoring experience is an expert beta. It is not yet reliably refactorable for ordinary Svelte developers.** Simple motion is pleasant through `Motion`; automatic layout on existing elements, native exit reversal, and attachment cleanup remove real work. Problems appear when developers do normal maintenance: extract an options object, switch to a native input, put a provider around existing markup, fade a translated dialog, or add a timeline to a layout card.

The greatest problem is that visually similar call sites can have different reactivity, SSR, configuration, and ownership behavior. Some differences are inherent to Svelte and should be preserved. Others are Astra implementation choices that should change. Repeating a warning in several guides does not make the latter good defaults. Passing regression tests establishes useful behavior in those fixtures; it does not establish that consumers can discover or compose it.

Keep the scope at **motion**. Do not restore general CSS functionality, build a universal prop merger, recreate React's component model, or add a new abstraction for every constraint. The strongest next changes mostly improve existing contracts without changing call sites, including the route handoff failure discovered by composing otherwise ordinary exits.

This review combines independent consumer, Svelte semantics, and React comparison tracks with a new packed consumer. Their initial claims were checked against one another and, where practical, reproduced through public imports. The report's priorities are the reconciled conclusions. Frequency estimates below describe likely workflows, not measured user telemetry.

## Evidence and comparison boundary

The [consumer source](2026-09-22-api-ergonomics/consumer/), [reproduction instructions](2026-09-22-api-ergonomics/README.md), and [recorded results](2026-09-22-api-ergonomics/evidence.json) accompany this review. It was built independently in `/tmp`, installed from `pnpm pack`, and used no repository aliases or internal Astra exports. Its `$lib` imports refer only to its own small scenario components. The repo's prepared qualification consumer was **not** used as the application template. Its documented overrides were applied only after testing the unoverridden installation.

| Subject                                    | Version actually examined                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Astra and qualified engine graph           | Astra 0.0.1; motion, motion-dom, framer-motion 13.2.0; motion-utils 13.0.0                                                                   |
| Consumer framework/tools                   | Svelte 5.57.0; Kit 2.70.3; Vite 8.2.2; TypeScript 6.0.3; svelte-check 4.7.6; pnpm 11.24.0                                                    |
| Independently installed headless component | Bits UI 2.19.0                                                                                                                               |
| Executed browser                           | Shared Chrome 152.0.7977.82, development and built production consumer                                                                       |
| Version-matched React comparison           | Motion for React from motion/framer-motion 13.2.0, documentation and installed source                                                        |
| Current React/Motion source comparison     | motion/framer-motion 13.4.1 and React/React DOM 19.3.0, registry metadata and published source inspection; not installed into the repository |

The fresh unoverridden consumer actually resolved framer-motion **13.4.0**, motion-dom **13.2.0 and 13.3.0**, and motion-utils **13.3.0**. That is an observation of this install, distinct from the registry's current-version query. Archive SHA-256: `869468587f075912c2c231a9c7b781d6cc8842958637d597763b036cf5916a17`.

Current branding and imports are **Motion for React**, `motion/react`. Historical `AnimateSharedLayout`, `exitBeforeEnter`, and `motion(Custom)` are not the comparison baseline; current equivalents use `LayoutGroup`, `mode="wait"`, and `motion.create(Custom)`. The package still uses framer-motion internally. See the official [upgrade guide](https://motion.dev/docs/react-upgrade-guide) and the [versioned comparison with all ten React examples](2026-09-22-api-ergonomics/react-comparison.md).

React snippets were verified against official documentation/source and parsed as JSX; they were **not mounted or typechecked as a React application**. Runtime parity and performance are not established here. This is an ergonomics review with bounded execution, not a release qualification.

## Prioritized findings

### F1 — Ordinary installation does not produce the qualified engine graph

**P1 · Packaging design defect and documentation gap. Frequency: every fresh adopter. Impact: runtime identity risk, strict-type failure, app-wide dependency constraints.**

A competent developer follows [authoring.md:10](../authoring.md#L10): pack, install the tarball, import `Motion`. Expected: the package installs its compatible runtime. Actual: two motion-dom installations, despite exact direct pins. `motion@13.2.0` depends on a framer-motion range; that transitive branch can carry another engine. Strict checking produced both upstream `HTMLWebViewElement` and duplicate declaration `TS2717`. Applying all four README overrides removed the duplicate-declaration failure, leaving the upstream missing type. `skipLibCheck` hides diagnostics; it cannot unify runtimes.

The cost is **two direct runtime dependencies, one required Svelte peer, one optional Kit peer, four consumer-wide overrides, and one current strict-declaration workaround**. Only the routes entry needs Kit. Consumers do not need to separately install Motion as a direct dependency. The eleven package entries are not eleven installation requirements.

The [README:33](../../README.md#L33), [site installation:85](../../src/lib/site/docs.ts#L85), and [release checklist](../release-checklist.md#L38) state the overrides; the authoring installation recipe omits them. [motion-system.md:64](../motion-system.md#L64) also retains an obsolete single-runtime-dependency description. Moving to another app, adding another Motion consumer, or refreshing a lockfile can change behavior without changing Astra code.

Resolve the distributable dependency boundary, then qualify an ordinary tarball install without app-global overrides. Investigate using one consistent upstream engine/export path rather than exposing internal graph identity as an application responsibility. Do not claim that adding another direct pin alone fixes a transitive range. The upstream declaration defect must remain attributed upstream, although it is still a cost of adopting Astra.

### F2 — A normal deeply reactive options refactor silently stops animation updates

**P1 · Confirmed implementation bug. Frequency: common extraction/reuse of options. Impact: stale animation with no type, compiler, or runtime diagnostic.**

```ts
let options = $state({ animate: { x: 0 }, transition: { duration: 0.05 } });
const panel = createMotion(() => options);
// Later in a click handler:
options.animate.x += 80;
```

Expected: the element moves to x=80. Actual in the packed consumer: a direct options object, a getter returning the proxy, and `<Motion motion={options}>` all stayed at x=0. A getter explicitly reading `options.animate.x` moved to 80. Replacing `options.animate = { x: 160 }` updated all four. The failure reproduced in the production build. All application types and the Svelte autofixer accepted these inputs without warnings.

[Options are shallow-read](../../src/lib/motion/motion-core.svelte.ts#L190) inside an effect; [refresh is queued](../../src/lib/motion/motion-core.svelte.ts#L493), so nested target reads occur after dependency tracking. [Motion's wrapper](../../src/lib/motion/MotionComponent.svelte#L34) inherits the hole. See [Reactivity.svelte](2026-09-22-api-ergonomics/consumer/src/lib/Reactivity.svelte) and evidence `core-qualified` / `production-core`.

This differs from `createMotion({ animate: { x: offset } })` capturing a primitive during initialization. That is ordinary JavaScript/Svelte snapshot behavior, and the pinned compiler warns about it. Svelte's [deep state and function-passing rules](https://svelte.dev/docs/svelte/$state) do not explain away the nested-proxy failure.

Fix dependency discovery synchronously inside the tracked effect, then defer DOM/engine work. Track the consumed nested targets, styles, variants, and policy fields without JSON-cloning MotionValues or accidentally recreating attachments. **The correct behavior should be the default; a more elaborate getter recipe is only a current workaround.**

### F3 — An opacity-only binding unnecessarily takes ownership of authored transforms, and its error can escape recovery

**P1 · API design restriction plus diagnostic implementation defect. Frequency: existing dialogs, positioned controls, CSS-transformed components. Impact: component rewrites or uncaught runtime errors for a fade.**

```ts
const panel = createMotion({ initial: { opacity: 0 }, animate: { opacity: 1 } });
```

Apply this to an existing `.dialog { transform: translate(-50%, -50%) }`. Expected: change opacity while preserving centering. Actual: [visual.ts:41](../../src/lib/motion/visual.ts#L41) rejects computed transform/translate/rotate/scale even when the binding has no transform or layout target. The packed opacity-only `translateX(20px)` probe threw an uncaught error twice and did not render its enclosing Svelte boundary's fallback. The deferred [attachment microtask](../../src/lib/motion/motion-core.svelte.ts#L461) leaves this failure outside the expected boundary path. This is separate from genuine transform/projection contention.

The real [Dialog adapter:49](../../src/lib/components/ui/dialog/dialog-content.svelte#L49) succeeds partly because it replaces transform centering with `inset-0 m-auto h-fit` when motion is supplied. Restoring a standard centering class is a realistic breaking refactor. A polished demo using different positioning does not establish transparent composition.

Allow paint-only bindings to leave authored transforms alone; check ownership when layout or transform-bearing options become active, including later changes and exits. The [timeline adapter already makes a narrower check](../../src/lib/motion/animate.ts#L98). This is motion-channel ownership work, not general CSS support. Retain strict diagnostics for actual competing transforms and make failures catchable or report them through an explicit supported diagnostic path. A robust implementation must test first mount, reactive opt-in, gestures, exit, and handoff; this change was not prototyped here.

### F4 — Nested Motion is not the SSR equivalent of parent.child()

**P1 · Missing capability in the recommended component path. Frequency: variant families and component extraction. Impact: incorrect server pose and possible visual correction on hydration.**

```svelte
<Motion motion={{ initial: false, animate: 'shown' }}>
	<Motion motion={{ variants: { shown: { opacity: 0.6 } } }}>Child</Motion>
</Motion>
```

Expected: the child starts at its inherited final pose in SSR. Actual packed production HTML: child `style=";"`; hydrated child opacity becomes 0.6. An explicit `parent.child(...)` emits the resolved inherited server style. No hydration warning was observed: **absence of an inherited SSR pose is established; a particular flash duration or hydration error is not.**

The component [constructs an independent binding](../../src/lib/motion/MotionComponent.svelte#L34); [runtime DOM ancestry](../../src/lib/motion/visual.ts#L51) arrives too late for SSR. [Binding child metadata](../../src/lib/motion/motion-core.svelte.ts#L195) solves the problem in the lower-level path. Replacing that explicit pair with visually equivalent nested Motion is therefore not a safe refactor.

Give nested Motion an explicit component-context variant ancestry for server resolution, while retaining explicit local overrides. Keep `parent.child()` for native bindings. Separate logical variant inheritance from DOM projection when designing this: currently a declared child must physically remain inside its parent, and a portal violates [that check](../../src/lib/motion/visual.ts#L53). Svelte context itself does not require DOM containment. Portal support is an architectural decision to test, not an automatic consequence of adding context.

### F5 — An unrelated native exit can break a shared route handoff

**P1 · Confirmed composition/implementation defect. Frequency: routes combining shared content and ordinary Motion exits. Impact: shared animation disappears after an unrelated UI change; the diagnostic misidentifies application identity.**

```svelte
<div {@attach routeShared('photo')}>Shared content</div>
<Motion
	motion={{
		initial: false,
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { duration: 1 }
	}}
>
	Unrelated page content
</Motion>
```

Navigate to another route with one matching shared element. Expected: the shared pair still works. Actual in the isolated packed production [route probe](2026-09-22-api-ergonomics/consumer/src/routes/route-probe/+page.svelte): without the unrelated Motion sibling the destination receives its temporary shared name and the browser creates old/new shared snapshots. Adding that sibling retains the outgoing route fragment; its plain shared element has no inert ancestor. Both route elements remain connected, and Astra reports **“Duplicate routeShared ID in one scope; this pair was skipped.”** The new shared snapshot is absent. Navigation and the native transition's ready/finished promises still succeed, so those checks alone miss the failure.

The detector in [routes.ts:80](../../src/lib/motion/routes.ts#L80) distinguishes retained sources through changed inert ancestry and outro events. Svelte can retain sibling nodes in the same outgoing fragment without marking each plain sibling inert. This is a normal framework lifetime exposed as a hole in Astra's composed route contract, not an application that intentionally duplicated a shared identity.

A bounded workaround was verified: adding `transition:presence|global={{duration:0}}` to the shared source marks it outgoing; the handoff then succeeds while the unrelated exit continues. The three control runs are recorded as `route-control-plain`, `route-control-exit`, and `route-control-marked`. Do not make consumers sprinkle zero-duration fades on shared elements as the final API. The adapter needs reliable outgoing route ownership, or a deliberately designed route-root registration if Kit's public lifecycle cannot identify it. Keep real duplicate-ID diagnostics; blindly discarding every older connected source could hide actual conflicts. Qualification must test plain shared siblings retained by exits elsewhere in the page, not only shared nodes inside their own transition roots.

### F6 — Factory creation, template containment, and policy sampling disagree in ways refactors expose

**P2 · Framework boundary exposed by API design, plus inconsistent policy timing. Frequency: common provider refactors; occasional live accessibility changes. Impact: changed defaults or motion continuing after a local opt-out.**

A binding created in a component's script does not inherit a `MotionConfig` that the same component renders around its native element. A nested `Motion` does. In the packed SSR result, `reducedMotion="always"` left the precreated binding at initial opacity **0.2**, while the nested component serialized opacity **1**. Changing from Motion to `<input bind:value {...binding.props}>` can therefore change policy even though the provider still surrounds the markup.

[Configuration capture](../../src/lib/motion/motion-core.svelte.ts#L190) follows [Svelte context](https://svelte.dev/docs/svelte/context), not DOM containment. React hooks also cannot consume a provider returned by their own component. The correct current repair is to put the provider above the component that creates the controller, or supply explicit options. Reading context only when attaching would damage SSR consistency and change ownership semantics; do not present that as a trivial fix.

A second mismatch uses the same getter shape:

```ts
const scene = createAnimate(() => ({ reducedMotion: reduce ? 'always' : 'never' }));
const reading = createScroll(() => ({ reducedMotion: reduce ? 'always' : 'never' }));
```

Changing local reactive `reduce` during playback left the timeline moving (x≈16 to x≈34), while the scroll link settled (x≈41 to x=100). `createAnimate` reads local policy [under untrack](../../src/lib/motion/animate.ts#L61); active settlement is driven by OS/provider notifications. The [site reference:619](../../src/lib/site/docs.ts#L619) explicitly says readers are sampled at playback start, so this is a **documented design inconsistency**, not an undisputed undocumented bug. The private notification used in [scoped-animate.svelte.spec.ts:184](../../src/lib/motion-lab/scoped-animate.svelte.spec.ts#L184) does not prove public local-state reactivity.

The system guide also still says route policy stays explicit ([motion-system.md:386](../motion-system.md#L386)), although routes now inherit and subscribe to MotionConfig ([routes.ts:140](../../src/lib/motion/routes.ts#L140)). Correct that stale description; do not remove working inheritance.

Prefer live local-policy observation within the attached scope, consistent with state/scroll, while preserving cleanup and standalone use. Keep provider creation semantics honest. A script configuration helper remains an unresolved option, not a recommended extra abstraction yet.

### F7 — Features compose inside a binding, but independent animation owners collide at whole-node granularity

**P2 · Deliberate design restriction. Frequency: recurring in richer components. Impact: runtime discovery and architectural work to add an effect.**

```ts
// The target already has a Motion state binding, or a layout attachment.
scene.animate('.card', { opacity: 0.5 }, { duration: 0.2 });
```

Expected: a timeline cue on a different property can accompany layout/hover. Actual: `timeline cannot animate an element owned by state` in the packed consumer. [ownership.ts:6](../../src/lib/motion/ownership.ts#L6) allows state plus layout, but excludes a timeline/scroll owner regardless of which property each writes. A selector makes this conflict impossible to express completely in static types.

The error offers `binding.animate()` or a separate child. The former is useful for a single target but lacks the scope's multi-element sequence surface; the latter changes markup and sometimes layout, semantics, or clipping. `Motion` also hides its internal binding, so reaching that escape hatch requires changing authoring path. React's [useAnimate](https://motion.dev/docs/react-use-animate) accepts a scope on a motion component without this guard, but that does **not** make concurrent same-property writes safe.

Retain ownership enforcement now. Evaluate a binding-aware sequence target or carefully restricted paint-property coexistence with interruption/exit tests before choosing either. Do not promise arbitrary owner mixing, remove the guard, or build a general CSS arbitration layer. State, gestures, and layout already compose through one binding; scroll progress can feed a MotionValue style, with caller-owned derived-value cleanup and explicit reduced-motion treatment.

### F8 — Automatic cancellation does not give application code a settlement result

**P2 · Upstream behavior amplified by Astra's abstraction. Frequency: timelines, busy indicators, navigation choreography. Impact: permanently pending control flow.**

```ts
busy = true;
await scene.sequence(steps);
busy = false;
```

Expected: completion or cancellation lets application state settle. Actual: after `scene.stop()`, the consumer remained `running` beyond the sequence's original duration; removing the scope stopped its animations but did not resolve that awaiting state. A `finally` block cannot help if the promise stays pending. Replacement and policy settlement have related consequences. The real [StoryPreview:101](../../src/lib/showcase/StoryPreview.svelte#L101) repairs transport state separately for exactly this reason.

[Binding animate](../../src/lib/motion/motion-core.svelte.ts#L593) returns `Promise<void>`; [scope methods](../../src/lib/motion/animate.ts#L25) return Motion playback controls; `scroll.animate` returns an attachment. These are meaningful different operations, but the completion contract is not visible in `Promise<void>`. The [guide warning](../authoring.md#L531) is accurate; it does not remove the application state machine.

React's useAnimate also stops owned playback on unmount without settling every surrounding async function. A fair React example needs replacement/cancellation handling too. Consider an additive `run.settled` promise with an explicit finished/cancelled result; preserve existing upstream thenability initially. Decide the binding equivalent at the same time. This is a high-value lifecycle improvement, not a reason to rename every `animate` method.

### F9 — Three presence APIs encode different jobs, units, and accessibility policy

**P2 · Naming and policy design. Frequency: almost every entry/exit user. Impact: wrong primitive or policy despite plausible code.**

| Surface                                           | Work it actually performs                                 | Units / retention / policy                                                                               |
| ------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `presence()`                                      | Opacity fade with cubic-out easing                        | Milliseconds; native Svelte transition; explicit/OS policy sampled at start; no MotionConfig inheritance |
| `binding.transition` / built-in Motion transition | Finite Motion target/variant trajectory                   | Target transition options in seconds; Svelte retains the node; inherited/live policy                     |
| `Presence`                                        | Replace a value's branch, default `wait`, optional `sync` | Child native transitions determine lifetime; the component adds no fade                                  |
| `popLayout()`                                     | Release an exiting node's flow box                        | Needs an actual native outro and a positioned direct parent; does not retain the node itself             |

Evidence: [presence.ts:7](../../src/lib/motion/presence.ts#L7), [Presence.svelte:4](../../src/lib/motion/Presence.svelte#L4), [motion-core:533](../../src/lib/motion/motion-core.svelte.ts#L533). Replacing a 0.2-second Motion transition with `transition:presence={{ duration: 0.2 }}` produces 0.2 milliseconds. Wrapping it in MotionConfig does not add inherited policy. Adding Presence around an exit-configured binding without its native transition does not fix missing retention.

During a one-second exit, changing MotionConfig to `always` set the Motion node to opacity=0/x=60, but it remained connected and inert until the original Svelte outro finished. The standalone fade continued visually. **Visual settlement, retained-node destruction, and Presence's exit-completion callback are different events.** Keep that distinction; promising immediate branch destruction would contradict the chosen native lifecycle.

Retain Presence for exit-before-enter/latest-value sequencing and retain popLayout. Ordinary Svelte conditionals do not need a React-style presence owner. De-emphasize or rename the narrow helper to a fade-specific name (for example, an additive `presenceFade` alias followed by deprecation), preserving milliseconds. For a simple fade, native Svelte fade with explicit reduced-motion duration is often enough. Arbitrary asynchronous safe-to-remove callbacks, unresolved `auto`/CSS-variable presence targets, and repeating exits are unsupported capabilities, not hidden equivalents of React presence.

### F10 — The beginner path and existing-component path are not yet a coherent progression

**P2 · Documentation/default selection and composition contract. Frequency: every new user, then ordinary component maintenance. Impact: unnecessary early choices and nonlocal refactor changes.**

The README begins with Motion. [Site introduction:36](../../src/lib/site/docs.ts#L36) says Motion but embeds the binding recipe; its next section says most interfaces begin with `state/lite`. The authoring guide leads with choosing the smallest feature entry. Those are different defaults. Root imports are coherent—everything except Kit routes—but beginners should not need to choose among eleven entry points before their first animation. Lite-to-full binding migration is good: change the import and retain markup/options; its types reject `layout` in lite.

`Motion` is a useful native HTML component, not a wrapper for arbitrary Svelte components or SVG. Nested `motion={{…}}` separates native CSS/events from engine targets/MotionValue styles and matches binding options. Flattening it would not fix the demonstrated failures. It forwards native attributes, handlers, snippets, attachment symbols and `bind:ref`; `as` must remain stable, with `{#key tag}` for intentional replacement. Native `class:`/`style:` directives cannot target a component, and a packed type probe rejected `bind:value` because the prop is not bindable. Keep native bindings for those jobs.

Bindings preserve existing element architecture, but `.props` contains an entire `style` string. An authored style before the spread is overwritten; one after it overwrites initial SSR motion. The literal before-spread case gets a useful TypeScript warning; spread-to-spread composition does not. The packed probe showed `opacity:0.2` replacing padding in one order and `padding:24px` replacing initial opacity in the other. Motion explicitly merges these styles; the real Card uses Bits' mergeProps. Recommend native `style:` for independent authored properties or an explicit motion-style merge. Do not invent a general CSS merger.

Headless exits require more than attachments. The installed Bits consumer uses `forceMount`, `child({ props, open })`, a native `{#if}`, merged primitive/binding props, and a native transition. The local Dialog/Accordion wrappers have been modified to provide that contract; they are not shipped as universal Astra adapters. The accordion deliberately uses native Svelte slide for intrinsic reveal. Preserving primitive IDs, refs, handlers, focus and logical open state remains essential on both React and Svelte. An early probe incorrectly replaced the primitive's generated DOM ID and lost focus restoration; passing the ID through the primitive fixed it. That was a consumer integration error, **not an Astra focus bug**.

One needless obligation can already go away: **Svelte 5.57 accepts `transition:panel.transition`**. The compiler, packed svelte-check (no member-directive diagnostic), and browser accepted it. The Svelte MCP autofixer rejected that syntax with a MemberExpression parser error, so the saved fixtures use aliases and pass the tool. Do not call aliases a Svelte requirement or add an abstraction to eliminate them; distinguish the current tool mismatch.

## Ten scenario comparisons

The linked Astra files are complete consumer components, including controls and the minimum presentation needed to exercise the behavior. The [React appendix](2026-09-22-api-ergonomics/react-comparison.md#ten-scenario-equivalents-and-adversarial-attempts) supplies code and official references for every row. Its routes example states its router-dependent boundary rather than substituting a local state swap for real navigation. No line-count score is used.

### 1. Conditional entering and exiting element

**Astra:** [Exits.svelte](2026-09-22-api-ergonomics/consumer/src/lib/Exits.svelte), Motion inside ordinary `{#if open}`; no presence wrapper required. A native binding needs both `.props` and `transition:binding.transition`. **React:** `AnimatePresence` must remain mounted around keyed conditional `motion.section`; `initial`, `animate`, `exit`, and transition live in direct props. Astra removes real wrapper/lifetime wiring here.

**Novice / refactor:** Astra's exit option without a directive is typed but cannot retain DOM (source-inspected); React's presence owner inside the conditional disappears too early. Extracting Astra markup into a custom component must preserve the native transition and appropriate `|global` scope; React extraction must preserve the keyed presence boundary. Browser-tested Astra exit, live-policy settlement and final removal. A pure fade is simpler with native Svelte `fade` plus explicit reduced-motion handling. Preserve semantics and disable outgoing interactions on both sides.

### 2. Keyed add, remove, reorder and undo

**Astra:** the same fixture creates one Motion per keyed item, one shared layout controller, and popLayout attachments on the actual list items; the direct parent is positioned. **React:** `AnimatePresence mode="popLayout"` around keyed `motion.li layout`, with ref forwarding when extracting a custom row. Both need stable data IDs, deleted-item state for undo, focus recovery and announcements when removing focused content.

**Novice / refactor:** one Astra binding reused in an each block produced the precise runtime error “create a separate binding for each native element”; `createLayout` being reusable makes the cardinality distinction non-obvious. Inserting an unpositioned parent breaks popLayout only at exit (source-supported). React index keys break identity, and extracting a row without its DOM ref breaks popLayout. Astra remove → reorder/undo kept the **same node**, restored its position, ordered 3/2/1, and allowed adding 4. Native keyed `animate:flip` plus transition is the simpler narrow reorder solution; it does not cover arbitrary shared projection.

### 3. Existing headless dialog or accordion

**Astra:** [Dialog.svelte](2026-09-22-api-ergonomics/consumer/src/lib/Dialog.svelte) integrates independently installed Bits UI with the full mount/transition bridge. **React:** the appendix's Radix version also uses controlled open state, forceMount, portal, asChild, Motion children and AnimatePresence. Neither side gets focus management or accessible labeling from the animation engine. The comparison retains title, description, input, close control and Escape behavior.

**Novice / refactor:** spreading an exit binding into an opaque Content cannot install its internal Svelte transition. Adding an opacity binding to a translated root reproduces F3; changing the actual headless IDs/refs can break focus. Browser-tested labeled dialog focus, retained close, reopen preserving node identity, and a corrected production Escape/focus-return path. Native slide on an accordion remains a sound choice; a native `<details>` or disclosure is not an equivalent substitute for a modal. Full modal inertness, all keyboard paths, and owner destruction of this exact installed dialog were not qualified.

### 4. Shared-layout tabs and card-to-detail

**Astra:** [Layout.svelte](2026-09-22-api-ergonomics/consumer/src/lib/Layout.svelte), one unnamed `createLayout()` controller, stable marker/card IDs, ordinary state changes, position-projected text host and preserve-aspect image host. **React:** LayoutGroup scopes layoutId; layout-enabled children / position projection and deliberate image geometry are also needed. Do not credit React with automatically undistorted arbitrary descendants. These examples use labeled section selectors (`aria-pressed`), not a claimed complete ARIA tabs widget; true tabs need keyboard and tab/panel roles on both sides.

**Novice / refactor:** equal IDs in separate unnamed Astra groups do not share; conversely copying the guide's fixed `id:'product-tabs'` into two widgets joins them. This follows the inspected scope implementation; cross-widget collision was not browser-reproduced. Removing a text participant makes it inherit surface scale. Moving a reflow source outside the participant parent's observed subtree can require `observationRoot` or a transaction. Browser samples confirmed shared card interpolation and text scale within about 0.000005 of 1 in the initial fixture; the final 18-frame image check retained its 16:9 aspect and approximately unit accumulated scale. Reversed nested exits retained the same child; both children disappeared after the full exit. Native Svelte crossfade suits paired replacement, while persistent reflow needs more.

### 5. Parent/child variants, stagger and nested exits

**Astra:** [Variants.svelte](2026-09-22-api-ergonomics/consumer/src/lib/Variants.svelte), explicit parent.child bindings, variant labels, per-node native transitions and global child participation; initial:false serializes the first final pose. **React:** component-tree variant inheritance, parent orchestration, and AnimatePresence for removal; nested AnimatePresence can introduce another boundary requiring propagate. Current docs show `delayChildren: stagger(...)`; Astra's `staggerChildren` remains supported by its pinned engine. [Official transitions](https://motion.dev/docs/react-transitions).

**Novice / refactor:** replacing explicit bindings with nested Motion loses SSR inheritance (F4); moving a declared child into a portal fails DOM containment. Omitting `|global` becomes material when a transition's own block is not the block removed. Those scope rules are [native Svelte semantics](https://svelte.dev/docs/svelte/transition), not a reason for a second Astra retention engine. Packed removal/recreation, close/reopen during an exit with two children, and initial SSR were exercised; exact stagger frame ordering and every nested local/global permutation were not exhaustively measured. Native Svelte transitions with delays are enough for a small static group, but do not replace a reusable variant vocabulary.

### 6. Hover, press and drag with state and layout

**Astra:** Layout fixture's semantic Motion button combines `layout`, reactive `animate.x`, hover/tap scale, numeric x drag constraints and touch-action. **React:** equivalent motion.button direct props; keyboard movement alternatives belong on both sides when dragging performs an actual task. Astra's showcase queue adds its own pointer capture, collision logic, cancellation and keyboard reordering; `drag` alone did not produce that showcase.

**Novice / refactor:** snapshot scalar options get a compiler warning; extracting a nested reactive options bag does not (F2). Adding a timeline to the same element hits F7. A responsive ref-based constraint or external drag handle exceeds Astra's declared numeric-bound capability. Real pointer hover reached scale 1.05, keyboard-event press approached 0.95, real drag reached its +40 bound, and reactive state retargeted x to 30. Native CSS hover/active is simpler for a decorative style change; native Svelte motion plus pointer handling is substantially more wiring for drag/inertia. No general CSS feature is proposed.

### 7. Scoped timeline, interruption and component teardown

**Astra:** [Timeline.svelte](2026-09-22-api-ergonomics/consumer/src/lib/Timeline.svelte), attach one scene, scope selectors, run a sequence, stop/replay/remove it. Scope removal cancels owned work. **React:** useAnimate provides scoped selectors and owner-unmount cleanup; the equivalent example explicitly stops an old run before replacing the whole sequence. Removing only the scope DOM while keeping the React hook's component alive needs separate stop handling.

**Novice / refactor:** await playback to clear busy state, then add a Stop button—the consumer remained pending. A selector targeting the already state-owned node threw. Moving a target outside the scope or using controls after teardown is rejected by Astra's runtime guards (source-inspected). Removed scene had zero element animations in the browser. A standalone native WAAPI/Svelte effect is smaller for one animation but needs explicit selector, repeat/replacement, policy and cleanup work to match this scenario. Astra's scope earns its existence; its cancellation result still needs work.

### 8. Container scroll with live reduced motion

**Astra:** [Scroll.svelte](2026-09-22-api-ergonomics/consumer/src/lib/Scroll.svelte), attach the real container and a separate decorative link; local reactive policy settled x≈41 to 100. `progress` is a MotionValue, and `motionStore` is the Svelte subscription bridge for semantic UI. Rendering `progress.get()` alone is a one-time read, not a Svelte subscription. Removing a previously attached container makes the controller not-ready rather than silently switching to window scroll (source-inspected).

**React:** useScroll with the container ref and a MotionValue style is concise. For live preference changes matching Astra's settle-to-final behavior, the appendix adds a real media-query subscription. Official [useReducedMotion documentation](https://motion.dev/docs/react-use-reduced-motion) promises live rerenders, but inspected [13.2.0 source](https://github.com/motiondivision/motion/blob/v13.2.0/packages/framer-motion/src/utils/reduced-motion/use-reduced-motion.ts) and [13.4.1 source](https://github.com/motiondivision/motion/blob/v13.4.1/packages/framer-motion/src/utils/reduced-motion/use-reduced-motion.ts) initialize state without a setter/subscription for that hook. This is a source-supported upstream discrepancy, not a React browser result.

**Novice / refactor:** attach scroll output to an already owned node, or move the actual scroller without moving its attachment/ref. A semantic progressbar must keep reporting actual progress when decorative motion settles. Native scroll listeners and derived values can implement this but need listener/observer/policy lifetime wiring. Real OS preference toggling was not performed; the browser test used public reactive local policy, separately from provider-policy exit tests.

### 9. SSR/hydration with initial:false and inherited configuration

**Astra:** [Reactivity](2026-09-22-api-ergonomics/consumer/src/lib/Reactivity.svelte) plus Variants; server styles showed same-template binding opacity 0.2 versus nested Motion 1, explicit initial:false opacity 0.7, lexical child final style, and absent implicit child style. Hydration produced no console warning. **React:** motion serializes initial/final-first values with component-context inheritance; interactive framework boundaries still apply. Neither server knows an OS media query without an application-provided policy.

**Novice / refactor:** use attachment-only markup expecting SSR motion styles; or replace Motion with a native binding under the same provider. Correct binding authoring includes `.props`, and configuration belongs above the creator component. Native Svelte generally renders final visible content and only transitions later changes; choose that when first-paint animation is unnecessary. Do not hide required server content behind animation without considering hydration failure. This review did not test no-JavaScript accessibility exhaustively.

### 10. SvelteKit shared-content route transition

**Astra:** the consumer's persistent [+layout](2026-09-22-api-ergonomics/consumer/src/routes/+layout.svelte) calls routeTransitions once; source and [/detail](2026-09-22-api-ergonomics/consumer/src/routes/detail/+page.svelte) attach routeShared with matching identity. The plain route control produced matched old/new shared snapshots and restored temporary names. Adding an unrelated exiting Motion sibling broke the shared handoff despite successful native ready/finished promises; marking the shared source with its own zero-duration native transition restored it (F5). Links and Kit retained navigation ownership in all three runs.

**React:** pinned Motion 13.2.0 local layoutId is not an equivalent router integration. A persistent router boundary or that router's View Transition support is required. Current **13.4.1 + React 19.3** additionally exposes `AnimateView` from `motion/react-animate-view`, using browser snapshots and React transition updates. The appendix verifies its current shape, without pretending to qualify a named router. [Official AnimateView](https://motion.dev/docs/react-animate-view).

**Novice / refactor:** assuming local layout IDs are route identities, registering a coordinator in each page, or duplicating shared content changes identity/lifecycle. Coordinator duplication and ambiguous application identity remain source-supported cases; ordinary navigation and the isolated sibling-exit refactor were executed. Native Kit onNavigate plus startViewTransition can achieve the same backend, but cancellation, temporary naming, rejection, preference and cleanup integration are work Astra removes. Back/forward, redirects, missing View Transition support, BFCache and rapid double navigation remain unverified in this review.

## Recommended authoring model

Choose by the job, then optimize imports after it works.

| First choice                                | When to use it                                                                                       | When to move lower                                                                                  |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Native Svelte transition / animate / motion | Simple fade/reveal or narrow keyed reordering                                                        | Need Motion variants, gesture states, shared projection or sequences                                |
| `Motion` from the root                      | New native HTML motion markup, especially keyed instances                                            | Need native bind:value/style directives, existing component integration, or direct binding controls |
| `createMotion(() => …)`                     | Preserve an existing native element; reusable/headless integration; imperative single-owner controls | Not a required intermediate step before layout-only or timeline work                                |
| `createLayout()`                            | Existing layout participants with no state-animation owner; shared local identity                    | Widen observationRoot or use update for a demonstrated observation/imperative boundary              |
| `Presence`                                  | Wait for an outgoing branch before displaying the latest requested value                             | Do not use merely to enable an ordinary exit                                                        |
| `popLayout()`                               | Retain exit visually while freeing its flow box immediately                                          | Keep the positioned-parent and native-outro contract                                                |
| `createAnimate()`                           | A scoped imperative scene or timeline                                                                | Coordinate with binding ownership explicitly; do not treat as a second writer on arbitrary nodes    |
| `createScroll()`                            | Window/container progress or scroll-linked decoration                                                | Feed values into an existing owner when needed; own derived values and policy                       |
| `createInView()`                            | Visibility is application state rather than only an animation trigger                                | `whileInView` on a binding for animation-only activation                                            |

Keep `motion={{…}}`. It adds nesting relative to React props, but establishes a useful boundary between native style/events and engine style/gestures. Fix its reactivity and SSR promises before changing syntax. Keep root imports as the tutorial default; show feature and lite entries as cost controls, with their unsupported features checked by types. Keep routes separate so non-Kit consumers do not acquire a router requirement.

`createMotion` is one stateful owner per mounted element; `createLayout` is a reusable participant factory/group; a timeline scope owns one root and its runs; a scroll controller tracks one container and one target. State these cardinalities beside the return types. `animate` returning a promise, playback controls, or an attachment is understandable when named by receiver; improving return-type docs and cancellation semantics is more valuable than blanket renaming.

Create state bindings, scroll controllers, and in-view readers during component initialization: their reactive effects need a Svelte owner. Do not move them to an event handler or a shared module as a routine extraction. createLayout and the attachment-owned animation scope also have standalone uses, but they only inherit component configuration when created in that context. A reusable helper should be called by each component instance. Attachment/controller cleanup is automatic; explicitly created MotionValues and derived values remain the caller's responsibility. get()/destructuring is a snapshot unless a reactive observer/store reads it. This setup/lifetime contract belongs beside the factory signatures, not only at the end of the guide.

Svelte owns state, keys, component initialization, snippets, native transition scope and retained DOM lifetime. Component/headless authors own semantics, refs, focus, portals and logical open/closed behavior. Astra owns correct reactive tracking, SSR engine styles, policy propagation, adapter ownership, identity and cleanup. Motion owns interpolation, springs, values and projection math. Kit and the browser own navigation and snapshot transitions. Ordinary CSS remains application presentation; Astra should only govern the motion channels it actually uses.

## The few changes with the highest return

These are proposals, not implemented production changes.

| Change                                                           | Current → proposed consumer call site                                                                                                                                             | Tradeoff and implementation implication                                                                                                      | Breaking cost / migration                                                                                                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Make the distributable own its compatible engine graph           | Four global overrides + tarball install → tarball install alone                                                                                                                   | Requires one qualified export/engine strategy; verify graph identity, declarations, SSR and runtime again                                    | Ideally no authoring break; consumers remove overrides only after that graph is qualified                                                                   |
| Track reactive options and inherit component variants during SSR | `createMotion(() => ({animate:{x:options.animate.x}}))` workaround → ordinary `createMotion(() => options)`; `parent.child` solely for SSR → nested Motion also resolves ancestry | Track consumed values without cloning MotionValues; context for server ancestry, explicit portal/override contract                           | Reactivity fix is compatible; changed nested SSR output may affect users relying on missing inheritance—announce and test opt-out/explicit initial behavior |
| Narrow transform claims and repair error delivery                | Rewrite a translated dialog or add an outer host → keep its CSS transform for opacity-only binding                                                                                | Guard later transform/layout opt-in; prevent stale handoffs; route deferred failure into supported recovery                                  | Compatible broadening; actual transform conflicts still error. No general CSS coexistence promise                                                           |
| Repair shared-route ownership across native retained exits       | Add an unrelated Motion exit and lose pairing → shared content continues to pair without extra directives                                                                         | Identify outgoing route fragments beyond inert ancestry; retain real duplicate diagnostics; prototype a route-root contract only if required | Prefer a compatible adapter fix; any explicit root registration would need a migration and SSR/Kit lifecycle qualification                                  |
| Make cancellation observable; make local timeline policy live    | `await run; busy=false` plus ad hoc stop repairs → `const outcome=await run.settled`                                                                                              | Track every completion/replacement/stop/disposal/policy path; settle once; retain existing control behavior initially                        | Additive candidate; retain then semantics for compatibility. Decide binding control shape before shipping                                                   |
| Teach one default and one complete native integration contract   | “Choose smallest entry” + separate warnings → Motion first for new HTML, complete binding example for existing HTML                                                               | Include styles/ref/events/transition/provider creation in one recipe; fixtures must use packed public APIs                                   | Documentation-first, no runtime break; deprecate a fade-specific presence alias only with a clear migration                                                 |

For the third proposal, the desired motion-only behavior is concrete:

```svelte
<!-- Existing markup should remain valid for opacity-only motion. -->
<div class="translated-dialog" {...panel.props} transition:panel.transition>…</div>
```

If `panel` later opts into layout or x/y/scale, retain an actionable conflict instead of silently overriding the transform. The direct-member syntax above works with the pinned compiler; tooling caveat is recorded in F10.

For cancellation, the proposed result is deliberately separate from upstream thenability:

```ts
const run = scene.sequence(steps);
const result = await run.settled; // proposed, not available today
if (result.status === 'finished') advance();
// Cancelled runs also settle, so application state can leave "busy".
```

An external binding bridge such as `<Motion binding={panel}>` could expose controls without replacing markup, but it would also reintroduce creator-scope configuration differences and require mutually exclusive options/ownership rules. **Do not add it in the first batch.** Prove demand after fixing current refactors. Likewise property-level owner arbitration and a script configuration provider need separate prototypes; they are not prerequisite “ergonomics cleanup.”

## Retain, consolidate, and defer

Retain **Motion, createMotion, layout attachments, MotionValues/motionStore, createAnimate, createScroll, createInView, Presence wait sequencing, popLayout, and the Kit route entry**. They remove distinct work; collapsing them into one mega-options object would obscure lifetimes. Retain native Svelte transitions and their milliseconds. Keep Motion option seconds. Expose the unit distinction in types/JSDoc and the relevant editor example rather than convert numeric values heuristically.

Consolidate the **recommended path, complete binding-forwarding recipe, and policy table**. De-emphasize/rename the fade-only `presence` concept, with an alias/deprecation path if renamed. Do not consolidate local layout IDs and route identities: live projection and browser snapshots have different lifecycles. Prefer unnamed groups in reusable-widget examples; named group IDs deliberately join controllers. Keep automatic layout as the default and explicit transactions as an escape hatch, not scaffolding every click requires.

Do not automatically wrap text/images or restore general CSS utilities. Use existing transformable content hosts and explicit crop/aspect contracts. Position projection, parent transforms, scroll/root registration, and observation roots are legitimate advanced constraints; the first resize/shared-element example must show the necessary content structure. `automatic:false` is not group isolation while other groups request observation, and transactions coordinate globally; explain that actual boundary rather than implying independence.

Defer drag parity, generalized logical variant portals, arbitrary async presence, arbitrary CSS transform coexistence, and a universal component factory unless product scenarios justify them. Missing drag reference constraints/elasticity/controls and HTML-only Motion are capability boundaries; they are not grounds to broaden the library beyond motion.

## Prioritized implementation backlog and open decisions

| Order | Work                                                                                 | Acceptance evidence                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Fix nested reactive option tracking (F2)                                             | Packed object/getter/Motion mutation and replacement cases; nested variants/styles/gesture targets; unchanged MotionValue identity and attachment lifetime |
| 2     | Resolve the distributable engine graph and strict upstream declaration handling (F1) | Clean unoverridden consumer has one engine instance; no hidden source aliases; strict diagnostics attributed and resolved or explicitly gated              |
| 3     | Add SSR variant ancestry to Motion (F4)                                              | Server/client initial:false equivalence through child components/snippets; local overrides; documented portal behavior; no cross-request state             |
| 4     | Allow paint-only authored-transform coexistence and catch diagnostic failures (F3)   | Existing translated dialog fades without repositioning; transform/layout conflicts still fail; boundary/recovery behavior verified                         |
| 5     | Repair route handoff with unrelated retained exits (F5)                              | Plain shared siblings survive a page exit refactor; old/new shared snapshots exist; true duplicates still diagnose                                         |
| 6     | Fix public local timeline policy observation; design cancellation settlement (F6/F8) | Active repeat/sequence stops or settles through public reactive state only; replacement, stop and teardown always settle the proposed result once          |
| 7     | Rewrite default/forwarding/presence guidance; fix stale recipes (F9/F10)             | A new packed consumer can copy the first path; complete style/ref/event/headless contract; consistent dependency and route-policy text                     |
| 8     | Prototype richer composition only against a real card/timeline case (F7)             | Same-property exclusion, exit takeover, disjoint-property behavior and teardown proven before adding API                                                   |

Unresolved decisions: whether Motion variant ancestry should remain DOM-constrained through portals; whether binding.animate should gain controls or only an additional settlement surface; whether same-component script configuration warrants a public helper; whether property-level claims justify their complexity; whether to retain an OS-aware fade helper under a clearer name. These require focused prototypes, not a parity roadmap.

Reconciliation matters: one reviewer initially classified sampled timeline policy as a bug; the explicit start-time documentation makes the primary finding API inconsistency. All reviewers found alias repetition burdensome, but compiler execution showed aliases are optional. The provider surprise is real but partly inherent context timing; fixing it by moving context lookup to attachment would trade away SSR correctness. The primitive-ID focus failure belonged to our initial consumer, so it was corrected rather than reported against Astra. These distinctions determine what to implement, document, or leave alone.

## Validation performed and remaining limits

Performed:

- Read AGENTS.md, public package metadata/exports/types, motion implementation, both authoring/system guides, site docs and shared recipes, all showcase components, component browser test assertions, and release checklist across the independent tracks. Root reconciled the implicated implementation and call sites.
- Packed main; publint strict passed. Installed a small independent consumer first without overrides, then with the four documented overrides. Saved both resolved graphs and strict diagnostics. Ordinary strict application checking with skipLibCheck passed; **skipLibCheck:false still fails upstream HTMLWebViewElement** under the qualified graph.
- Ran repository `check` (0 errors/warnings) and `test:server`: **22 files, 97 tests passed**. A semantics reviewer also ran six focused server files, eight passing tests; those overlap the baseline and are not added to its count.
- Executed the saved reproduction script after isolating its fixture config; packing, independent install, application check and production build all passed. Built consumer development and production code; final application check reported **0 errors, 0 warnings**. Negative type probes correctly rejected lite layout and Motion bind:value. All saved Svelte fixtures passed the Svelte autofixer after using transition aliases.
- Opened the allocated loopback preview with the shared Chrome MCP; read accessibility snapshots, console and network; exercised the scenarios described above. Production page resources returned 200 and its ordinary-flow console had no errors/warnings. The deliberate transform probe separately produced the reported uncaught error; the mixed route/exit probe produced the duplicate-identity warning and missing shared destination snapshot. Development had an irrelevant missing favicon request.
- Verified production SSR styles from HTTP HTML, production reactivity/policy behavior, real pointer hover/drag and dialog Escape/focus return. Captured a [screenshot](2026-09-22-api-ergonomics/consumer.png) for the layout fixture and measured text/image projection. Recorded raw outcomes with their development/production labels instead of converting every source-supported claim to a browser pass.
- Compared official current React/Motion docs with 13.2.0 and published 13.4.1 source; parsed eleven JSX fragments. No React app installation, repository upgrade, publication, merge or production API edit occurred.

Not established: Firefox/WebKit or physical device behavior; complete repository browser suites; React runtime or exact visual parity; all novice/refactor combinations at runtime; every portal/headless integration; a plain non-Kit installed consumer; exhaustive image aspect-change distortion; all nested transition timing permutations; actual OS preference-event playback; route cancellation/history/BFCache/redirects; performance or bundle-size advantage; editor autocomplete usability with humans; viability of the proposed ownership/context/cancellation implementation. Existing repository tests for these areas were inspected where relevant, not silently counted as executed.

The verified failures are enough to prioritize the work above. They are not evidence that every other path is correct, nor a reason to discard Astra's useful Svelte-native foundation.
