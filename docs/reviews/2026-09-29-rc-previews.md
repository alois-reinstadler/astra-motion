# Release-candidate snippet previews

This bounded pass adds runnable previews for the seven new adoption recipes and
refreshes the three existing motion snippets through explicit source mappings.
It changes no documentation content or core animation source.

## Integration manifest

- `src/lib/site/snippet-previews.ts`
- `src/lib/site/snippet-previews/getting-started--native-svelte.svelte`
- `src/lib/site/snippet-previews/getting-started--panel-recipes.svelte`
- `src/lib/site/snippet-previews/getting-started--accordion-recipe.svelte`
- `src/lib/site/snippet-previews/getting-started--dialog-recipe.svelte`
- `src/lib/site/snippet-previews/getting-started--headless-recipe.svelte`
- `src/lib/site/snippet-previews/motion-values--follow-value.svelte`
- `src/lib/site/snippet-previews/animate-view--imperative-builder.svelte`
- `src/lib/site/snippet-previews/reorder--list-binding.svelte`
- `src/lib/site/snippet-previews/animate-presence--exit-data-value.svelte`
- `src/lib/site/snippet-previews/text-animation--replacement-value.svelte`
- `docs/reviews/2026-09-29-rc-previews.md`

All ten fixture files are additions. The registry preserves the historical
fixtures and existing child-source mappings. It selects the bound reorder and
single-value presence fixtures for their current section IDs, and uses the same
selected path for the runnable component and complete copyable source. Each new
fixture is standalone; there are no missing local child imports. Public-source
conversion uses the existing canonical transformer.

The changed installation snippet remains the existing documented code-only
exception. The complete Card forwarding root on the Motion page remains a
code-only shell because it still needs an application child and caller.

## Example behavior and presentation

- Native checkboxes preserve `bind:group`, scoped styles, SSR props/attachment and
  the explicit global transition.
- Changing panels retain outgoing item data through the value snippet. Controls
  use honest section-navigation buttons instead of claiming a complete ARIA tabs
  interaction pattern.
- Accordion and native-dialog IDs use `$props.id()` so multiple preview instances
  cannot collide. The dialog waits on additive settlement before closing and
  keeps native modal/Escape behavior.
- The Bits UI dialog preserves primitive props with `mergeProps`, force-mount
  branching and native transition retention. Its optional `bits-ui` import stays
  visible in complete source. The portaled surface has its own styling.
- Following values bridge ordinary text through `motionStore`; View snapshots
  show the document outcome. Reorder uses `bind:values` and the two replacements
  use single-value presence.

## Executed verification

- All ten fixtures passed the Svelte MCP autofixer with no issues or suggestions.
- All ten transformed public-source fixtures compiled for both client and server
  with zero compiler warnings; each source has no private `$lib` import and no
  unresolved local child dependency.
- Focused strict Svelte/TypeScript check against `/workspace/wt/astra-rc` integrated
  APIs: zero errors and zero warnings. A temporary tsconfig maps `$lib` to that
  worktree and includes the ten fixtures plus required Node/Vite ambient types.
- Scoped ESLint passed for the registry and all ten additions.
- Prettier formatting passed; no assertion was weakened and no sleep was added.

Evidence: `/tmp/astra-rc-20260929/preview-check.log`,
`preview-sources.log`, `preview-eslint.log`, and `preview-format.log`.
Reproduction helpers: `tsconfig-previews.json` and
`check-rc-preview-sources.mjs` in that same directory.

No full suites or browser sessions were started during this pass, as requested.
The parent must run the integrated snippet registry/guide checks and headed
interaction tests. In particular, dialog Escape/return focus, headless rapid
reopen, accordion interruption, pointer reorder, and View Transition fallback are
not claimed as browser-verified by this worker.

The independent vgpu preview remains running on managed allocation
`astra-review-consumer`, [GPU motion study](http://100.64.0.2:4099).
