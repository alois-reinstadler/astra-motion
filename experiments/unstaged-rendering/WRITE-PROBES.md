# Motion-only native-write and eager-state probes

These fixtures use Astra's real Motion projection and managed presence. They do not
use Svelte transitions, `animate:`, CSS animation, or browser View Transitions.
The historical `Fixture.svelte` native-outro negative control is unchanged.

`WriteFixture.svelte` adds a 30-cell grid, a promise-driven sibling above it, and
ordinary deeply reactive state. `write.spec.js` measures outgoing boxes, surviving
cells at the first sampled animation frame, active transforms at 90ms, final DOM
order, deep `splice`, disposal, errors, and idle capture counts. The test suite
**also passes when explicitly asserted unsupported cases reproduce their failure**.
It does not establish full Motion/React trajectory parity. The survivor
40px ceiling detects the previous compiler probe's roughly 477px jump but is not
a subpixel-equivalence claim. Wall-clock frames can advance between samples.

## DOM interception

`installWriteProbe('dom', host, app.read)` installs temporary native method/setter
wrappers. Each wrapper checks containment before the physical write, opens the same
experiment-only Motion snapshot bridge, and schedules one microtask closer. It
captures actual Svelte `before`, style `setProperty`, and promise-branch removals
without instrumenting component callbacks. Reentrant capture is guarded before
geometry policy reads. Prototype descriptors are restored on disposal; captures stop
while Motion animation frames continue and remain idle after completion.

Covered method/setter wrappers:

- Node `insertBefore`, `appendChild`, `removeChild`, `replaceChild`, `nodeValue`,
  `textContent`.
- Element/CharacterData `before`, `after`, `remove`, `replaceWith`.
- Element `append`, `prepend`, `replaceChildren`, `innerHTML`, `setAttribute`
  except style, and `removeAttribute`.
- CSSStyleDeclaration `cssText`, `setProperty`, `removeProperty`; transform, opacity,
  visibility, will-change, and transform-origin property writes are excluded.
- HTMLElement/SVGElement `style` getters associate declarations with owning nodes.

This list is wrapper coverage, not exhaustive per-method geometry qualification.
Geometry is established for the fixture's actual paths. Global prototype patches
still execute a scope check for unrelated application calls. A text-only update
within the host triggers 30 rectangle reads. Synchronous capture can invoke user
callbacks in the middle of a Svelte native write: an adversarial internal `beforeCommit` callback that itself flushes a
state update reproducibly leaves an extra outgoing node. This is a retained failure,
not a supported reentry contract.

Explicit uncovered-path controls prove that direct `style.gridTemplateColumns`,
`setAttribute('style', ...)`, `className`, `classList`, cached original native
methods, and moving a node to an outside receiver bypass capture. Direct property
style setters such as `style.width` are not wrapped. Unobserved ancestor/sibling
writes, CSSOM, fonts, viewport changes, shadow roots, other realms and replacing
these descriptors by another library are also unqualified. `cssText` is deliberately
conservative, and excluded transform properties can affect descendant geometry.
This cannot be described as universal pre-mutation observation.

## Synchronous eager subscriptions

`installWriteProbe('eager', host, app.read)` resolves Svelte 5.57.0's private
`eager_effect` from the same bundled module identity. A manually disposed effect
root owns the subscription. The getter observes columns and every item index;
geometry capture runs untracked, once per open transaction. Finalization is deferred
until a microtask. `eager-tick` retains the same snapshot but closes through public
`tick().then(...)`, with the same transaction identity guard.

Both variants preserve ordinary, nested, and interrupted exits and retain the
initial reorder animation. Both still reproduce the mixed staged-parent 302px
outgoing error. The extra tick does not solve it. The cache diagnostic below
identifies a second requirement: preserve the captured presence boxes until commit.

Both also miss promise-driven branch reflow because the registered getter does not
read its internal branch state. Existing automatic cache projection eventually
animates, but the first sampled frame can already show the new 70px offset.
They avoid unrelated text-only measurements. Deep array operations synchronously
notify for intermediate duplicate keys; the fixture verifies final DOM order and
coalesced capture, not intermediate array validity. Reading every index after every
proxy write has an O(n²) ceiling, even when geometry snapshot work is coalesced.
The runnable `eager-cost.mjs` check counts 500 synchronous callbacks and 250,000
item reads for an in-place 500-item reverse, versus one callback and 500 reads for
array replacement. These are dependency-read counts, not browser timings.

`untrack` does not remove the surrounding eager effect's mutation restriction:
an adversarial internal `beforeCommit` callback that writes Svelte state throws `state_unsafe_mutation`.
Initial getter exceptions, native mutation exceptions, normal cleanup and reinstall,
and an outstanding tick closer after disposal have explicit tests. Experimental
async compiler mode, forks, deferred batches, hydration, dev/HMR, multiple Svelte
copies and arbitrary dependencies are unqualified.

## Presence-cache overwrite diagnostic

`cache-trace.spec.js` observes writes of presence-box records while the eager-tick
transaction is open. Both outgoing nodes first receive the correct old width
(56.39px); later writes replace it with 116.80px. Key 5's left offset changes from
302px to 0. This occurs while `inCapture()` is still true, so simply extending the
transaction lifetime cannot preserve those measurements.

A diagnostic variant preserves each first captured presence box during that
transaction. The mixed-publication outgoing error falls from 302px to 0.016px,
and a retained cell still moves through an intermediate position. This isolates
cache overwrite as a cause of this specific failure. The intervention is a
shape-filtered `WeakMap.set` wrapper in the test, **not a proposed library API**.
A maintainable implementation would give presence snapshots explicit ownership
and prevent later observational measurements from replacing a transaction's origin.
That implementation still needs cancellation, nested ownership, reentry, and async
commit tests. It would not make unobserved updates interceptable.

## React reference and interpretation

`react-reference.spec.js` runs the same combined reorder/resize/removal against
React 18.3.1 and Motion 13.4.4, including interruption after 90ms. It checks outgoing
geometry, active motion, final order, and records per-frame retained-cell positions.
The prototypes independently require numeric intermediate retained-cell positions;
an identity transform string is insufficient. Real-time traces are not synchronized
cross-framework curves. Full frame-by-frame, spring, shared-layout, and cross-browser
parity remain unproven.

## Integration

Only the experiment build exposes `__probeBegin`; no production source or installed
runtime is patched. It currently requires canonical Svelte private-module identity
and rejects versions other than 5.57.0. React reference exports reuse the existing
pinned staged-rendering React fixture and dependencies. Provenance records versions
and a hash of the imported React source/model/shared styles as well as the experiment,
Astra source, and generated bundle. No hook is enabled in the shipping library.
