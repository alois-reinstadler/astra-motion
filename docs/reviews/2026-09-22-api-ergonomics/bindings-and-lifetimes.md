# Follow-up: native bindings and lifecycle choices

Reviewed 2026-09-22 against the same packed Astra 0.0.1 consumer, Svelte 5.57.0 and Chrome 152. This qualifies the authoring recommendation in the [main review](../2026-09-22-api-ergonomics.md). Production APIs were unchanged at this prototype stage. See the subsequent [approved implementation](implementation.md).

The user requires ordinary form values to be bindable and prefers `$effect` with `untrack` for browser setup. Treat these as design requirements. They justify evaluating tag-specific components beyond the current generic Motion component; they do not justify a universal custom-component HOC or general CSS functionality.

## Tag components and native bindings

`motion.input` is valid Svelte component syntax. A namespace object can expose ordinary compiled Svelte components. The syntax itself provides no extra native behavior.

Today's `Motion as="input"` uses `<svelte:element>`, whose only supported native binding is `bind:this`. Merely marking a component prop `$bindable` enables the parent/component channel; the component must also implement the component/DOM channel. A generic HOC around the current Motion therefore does not solve native value binding. See the official [dynamic element contract](https://svelte.dev/docs/svelte/svelte-element) and [bindable component example](https://svelte.dev/docs/svelte/$bindable).

Prefer thin, compiled components that render their native tag, declare supported `$bindable` props, and use Svelte's native binding directives internally. Generate repetitive wrappers at package build time if needed; reuse Astra's existing motion owner rather than introducing another engine layer. A component with explicit native branches could also work, but tag-specific files make the supported bindings and types easier to inspect.

| Benefit                                                                               | Cost or boundary                                                                                           |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| The element is visible in `motion.button` / `motion.input`; no separate `as` decision | Another public surface if generic Motion remains equally prominent; select one recommended default         |
| Fixed tag allows specific event, ref and binding declarations                         | Every advertised binding needs a contract and tests; native attribute types alone do not describe bindings |
| Native directives can preserve form behavior without manually simulating input events | Input type branches, select values, files, media and readonly measurements require separate qualification  |
| Small wrappers can share `createMotion` and native transition handling                | More generated output and declarations; measure namespace tree shaking against direct component exports    |

These are still Svelte components. `bind:this` refers to a component instance; a typed `bind:ref` is the intended DOM reference. Native directives and parent-scoped element selectors do not become transparently available through a component. Existing native markup plus `createMotion` remains necessary for exact native authoring and third-party integration.

`bind:group` is a specific boundary: Svelte documents that the grouped inputs must belong to the same component. Forwarding a group value through many wrapper instances does not by itself reproduce the compiler's shared group registration. Keep native inputs as the supported escape hatch unless an explicit group design is justified and tested. See [native bindings](https://svelte.dev/docs/svelte/bind).

Recommended next prototype scope: input value/checked, textarea value, select value including object and multiple selection, and correctly typed DOM refs. Define unsupported bindings explicitly before advertising native parity. Keep `Motion` compatible during evaluation; avoid immediately shipping both syntaxes as equivalent defaults.

## Bounded prototype evidence

The temporary packed consumer at `/tmp/astra-ergonomics-repro-2sTeOp/consumer` gained `src/lib/binding-probe/Input.svelte`, a namespace export, and `/binding-probe`. The input used `$bindable()` plus a real `<input bind:value>`, `createMotion`, its props and native transition. It imported only the installed public Astra package. This was a development-browser prototype, not a production API change.

Verified:

- Namespace component syntax and consumer types: `pnpm check` returned zero errors and warnings.
- External parent state updates reached the input; dispatched input events updated parent state and invoked the forwarded callback once.
- Numeric input converted `"4"` to the number `4`. Empty numeric input produced `null` in installed Svelte 5.57.0, confirmed in its `bindings/input.js`; the prototype's value type was widened accordingly.
- The forwarded callback and a native input control both observed the updated bound text during the input event. Earlier assertions based on the documentation's event-order wording failed; the native control established this was not an Astra wrapper difference. Do not infer an Astra contract from those failed assumptions.
- Form reset restored `defaultValue="reset"` in both DOM and parent state. Conditional removal disconnected the input.
- The final browser assertion sequence passed; the final console contained no errors or warnings. The development preview initially requested a nonexistent favicon. The opened tab and owned preview were closed.
- The final input prototype passed the Svelte autofixer. No React comparison, bundle measurement, checkbox/group/file/select/media binding, function-binding, autofill, IME, accessibility-tree equivalence or active-exit behavior was established by this narrow prototype.

The prototype demonstrates feasibility, not a complete input contract. The temp path is session evidence, not a distributable example or a guaranteed permanent artifact.

## Lifecycle: separate lifetime, ordering and measurement

Use `$effect` plus `untrack` for browser setup that should not subscribe to incidental state reads, with cleanup returned to the effect. Keep reactive targets and live reduced-motion policy in tracked reads; wrapping every motion operation in `untrack` would recreate the stale-state problem from F2. Keep element-owned work in attachments so conditionals and keyed replacements own its cleanup. Preserve server-relevant initialization and cleanup separately: browser effects do not run during SSR.

This preference is compatible with Svelte's existing implementation: in runes mode, Svelte 5.57.0's `onMount` calls `user_effect`, invokes setup through `untrack`, and returns its cleanup. See the [versioned source](https://github.com/sveltejs/svelte/blob/svelte%405.57.0/packages/svelte/src/index-client.js). Do not promise an ordering or layout improvement merely from changing the spelling.

[Issue #8547](https://github.com/sveltejs/svelte/issues/8547) concerns renderless child ordering. Registration or effect callback order must not stand in for current child order after keyed moves or conditional insertion. For connected DOM participants, inspect actual node order; portals and disconnected trees require an explicit boundary. Astra's layout registration already sorts nodes in `layout.ts`, and Motion 13.2.0's `calcChildStagger` sorts visual elements by node position.

[Issue #16648](https://github.com/sveltejs/svelte/issues/16648) addresses the more direct layout hazard: a child's pre-effect can observe geometry after a parent has already mutated its DOM. The maintainer explains that pre-effects participate in the mutation sequence, rather than preceding all mutations. The [current effect documentation](https://svelte.dev/docs/svelte/$effect#%24effect.pre) now states that parent DOM may already be updated and that async block updates can precede the pre-effect. This is not a React `getSnapshotBeforeUpdate` equivalent. `untrack` changes dependency tracking, not this timing. Neither `tick` nor MutationObserver can retrospectively read an uncaptured old box.

Astra's current layout implementation already takes a different route: `observe.ts` detects mutations/resizes; `layout.ts` seeds automatic snapshots from cached projection measurements before measuring the new layout. Explicit `updateLayout` snapshots before `flushSync(change)`. Retain these strategies pending validation instead of replacing them with per-component `$effect.pre` measurements. Cached observations are not a universal pre-mutation snapshot guarantee.

Add targeted acceptance cases to the layout/lifecycle work: parent class changes that reflow a nested child; extraction through snippets and extra components; keyed reorder and insertion; batched updates and interruption; async boundaries; scroll, resize and content reflow between measurements. Compare automatic behavior with explicit transactions and assert the measured old/new boxes, not merely the final style. No runtime reproduction of #16648 or async-mode qualification was performed in this follow-up; its implications above are based on the discussion, current documentation and Astra source inspection.
