# Independent API review

Reviewed `src/lib/motion`, `docs/research/decision.md`, the motion lab, and package
exports. This is a static adversarial API review; lifecycle failures below require
browser reproduction before being called verified runtime failures.

## Verdict

Keep native attachments, Svelte transitions, and the separate SvelteKit integration.
Do not adopt compiler attributes yet. The prototype demonstrates a small Motion
adapter with explicit transactions; it does **not** yet deliver the requested
automatic `layout` behavior. Adopt it as an experimental transaction API, subject to
the correctness fixes below, rather than present it as the completed library design.

The strongest ergonomic choice is that an ordinary element remains an ordinary
element. `const layout = createLayout()` followed by `{@attach layout()}` is readable,
typed, and composable without creating a component for every HTML tag. Svelte's own
`transition:` already communicates presence more directly than an animation-props DSL.

## Ranked findings

### P1 — Wait mode exposes a completion protocol consumers can easily violate

`Presence.svelte` requires the snippet to attach `onoutroend={complete}` to exactly
one transitioning root. Forget that handler, render an empty snippet, or conditionally
omit the transition and wait mode remains empty indefinitely. The type signature
cannot prove that completion is connected. One root's `outroend` also does not prove
that a longer nested outro group has finished; overlapping new and retained outgoing
content is a specific case to test. Multiple roots can report the first completion
before their siblings are finished.

**Improve:** explicitly restrict the prototype to one transitioning root and document
that contract at the component export, with a development diagnostic for missing
registration. For a production primitive, prefer a small transition-registration
protocol that aggregates participating completions, or a clearly named single-root
`Wait` primitive. Do not introduce general React-style child ownership.

Ordinary A → B → C updates while A exits read the latest `value` at completion, so
skipping B is intentional latest-wins behavior, not lost data. Document it. Identity
uses `Object.is`: passing a freshly reconstructed object restarts replacement even
when its business ID is unchanged. Consider a separate primitive `key` with live
snippet data, or require a scalar identity in initial documentation.

Changing `mode` from sync to wait can reveal the stale initial `current` because sync
rendering never updates it. Make mode immutable and diagnose changes, or explicitly
synchronize state when changing mode. Test A → B → A reversal and delayed callbacks
from a previous exit generation.

### P1 — Explicit transactions are a meaningful scope limitation

`layout.update` snapshots all participants around `flushSync`. This is a reasonable
correctness boundary, but updates from `bind:`, stores, async data, image/font loading,
media queries, browser resize, and another component do not automatically enter it.
A compiler that merely inserts the attachment cannot change this fact. The demo's
explicit state-changing buttons demonstrate transactions, not general automatic CSS
layout animation.

**Improve:** make this constraint prominent in the first public example and enumerate
which changes animate. Keep automatic invalidation as an unresolved architecture gate.
Do not compensate by globally polling or silently rewriting arbitrary user mutations.
A future automatic backend should preserve the attachment API and leave explicit
transactions as an optimization/correctness escape hatch.

`updateLayout(change: () => void)` currently permits asynchronous callbacks in
TypeScript and discards their result. This contradicts the decision document's
stated synchronous-only guarantee. Reject Promise-returning callbacks in the public
type and detect thenables at runtime with a concrete diagnostic. Detection cannot
undo a continuation already started; the documentation must still require loading
async data before the transaction.

### P1 — Route API is not available to package consumers

At review time `package.json` exports only `.` and the motion barrel does not export
`routeTransitions` or `routeShared`. Workspace `$lib/motion/routes.js` imports conceal
this packaging gap.

**Improve:** publish a dedicated `astra-motion/routes` entry. Keep `$app/navigation`
out of the general entry so local motion remains usable outside SvelteKit. Publish
feature subpaths only where bundle checks justify them. Align the Svelte peer minimum
with the attachment and compiler APIs actually required; `^5.0.0` overpromises support.

### P2 — Some names imply a narrower effect than they actually have

`layout.update` sounds group-local but calls a global transaction over every
registered group, including groups with different policies. This may be the correct
coordination behavior; it must be visible in documentation and performance claims.
`createLayout({ id })` establishes a global named scope, so separate controllers with
the same explicit ID intentionally share identities. It is not a nested LayoutGroup
context, and parent scopes do not automatically compose.

**Improve:** keep `updateLayout` as the canonical global operation and describe
`layout.update` as a convenience alias, or remove the alias before stabilizing the API.
Describe controller identity as the default isolation boundary. Use explicit shared
scopes only when cross-controller handoff is intended. Do not add a wrapper component
merely to imitate Motion React's LayoutGroup.

### P2 — Transform ownership is safe but still costly to authors

Failing instead of silently overwriting app transforms is appropriate. Moving rotate
and scale into `layout({ style })` nevertheless couples visual styling to the motion
adapter. The diagnostic suggests fields that cannot express arbitrary authored
matrices or 3D transforms. Styles added after registration also need a defined contract.

**Improve:** document supported numeric transforms with a complete native-element
example and clearly state unsupported cases. Mark layout-managed properties as owned
for the entire attachment lifetime. Do not imply that existing CSS transforms are
preserved automatically. Keep typed values in Motion's existing pipeline.

### P2 — Shared configuration is not yet an application policy

Reduced motion defaults respect the user preference, which is a good default. An app
override must currently be repeated across layout controllers, presence transitions,
and route setup. A passed shared object helps, but no single installation point exists.
Presence duration uses milliseconds while Motion transition durations use seconds.

**Improve:** provide one documented immutable policy object recipe first, including
all three integrations. Document duration units on both exports. Add context only if
real application usage shows repeated configuration remains burdensome.

### P3 — Diagnostics and debugging need clearer public boundaries

`stats()` exposes a participant count and an active-animation estimate but is mixed
into the main authoring controller. Duplicate route diagnostics omit the offending
ID/scope. Runtime transform and positioning errors lack element context.

**Improve:** give diagnostics a code, ID/scope, and optional element reference; document
whether errors throw or skip animation. Keep performance inspection explicitly
experimental. These improvements are more valuable than adding bare compiler syntax.

## Smaller API recommendation

Keep `createLayout`, one canonical synchronous `updateLayout`, `presence`, `popLayout`,
and the isolated route entry. Prefer ordinary `{#if}`/`{#key}` plus `transition:presence`
for sync mode. Narrow the component to the wait use case rather than exposing a
React-familiar `Presence` component where Svelte already handles lifecycle. Preserve
the current function attachment shape unless browser tests reveal a lifecycle reason
to change it. Public examples should include attachment forwarding through native
attribute spreads in custom components.

The compiler has not earned its complexity: it removes the visible attachment while
leaving the transaction requirement and lifecycle constraints intact. The valuable
breakthrough here is reusing Motion's projection without importing a foreign component
runtime. Automatic layout remains the next technical breakthrough to prove.
