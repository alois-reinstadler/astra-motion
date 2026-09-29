# Documentation snippet previews

Every `DocSection.code` has either a live preview or an explicit entry in
`codeOnlySnippets` in `src/lib/site/snippet-previews.ts`. The documentation tests
reject snippets that have neither, or both.

For visual snippets, add a Svelte component at
`src/lib/site/snippet-previews/<guide>--<section>.svelte`. The registry discovers
it automatically. Demonstrate the specific snippet, adding the state, controls,
and visible geometry a focused excerpt omits. Keep imports local to the motion
library; `publicExampleSource` converts them to public package imports in the
copyable source. If the example needs child components, register their filenames
in `childFiles` so readers receive every file.

The article renders the preview immediately above its excerpt using `DocExample`.
Reset remounts its isolated Svelte root. Complete source displays the exact files
used by the preview. Additional snippet previews mount when they approach the
viewport, so entrance animations are visible when readers reach them.

Use a code-only exception for installation commands or application integration
that cannot meaningfully run inside a local preview. Explain why in the registry;
do not substitute an unrelated animation.

Run `pnpm exec vitest run --project server src/lib/site` and `pnpm check` after
editing examples. `--project server` selects the Node test project. Verify the
preview, its interaction, Reset, and complete source in the managed browser on
desktop and a narrow viewport.
