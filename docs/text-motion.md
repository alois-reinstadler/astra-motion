# Text motion contract

Import `TextReveal` and `TextSwap` from `astra-motion/text`. Both accept plain
`text`, `as` (`span`, `p`, `div`, `h1`–`h6`), native host attributes, `effect`
(`fade`, `slide`, `blur`), `split` (`whole`, `words`, `graphemes`), `stagger`
(seconds, default 0), `direction` (`up`, `down`, `left`, `right`), `distance`
(pixels, default 12), `duration` (seconds; inherited configuration or 0.3), and
`locale` (default `en`). The direction describes travel toward the resting pose.

`TextReveal` supports `trigger="mount"` (default), `"viewport"` and `"state"`.
State mode reads `visible` (default true); viewport mode reads `once` (default true)
and `viewport` (`root`, `margin`, `amount`). Reduced motion exposes the complete
message immediately, regardless of trigger and without stagger delays.

`TextSwap` supports `mode="sync"` (overlap, default) and `"wait"` (exit before
enter). It uses Astra's presence orchestration. Wait requests coalesce to the latest
value; returning to the outgoing value cancels its removal. Sync retains at most
two layers: another distinct request during an exit replaces the visual boundary
with the latest message immediately. Identical requests do nothing. Empty strings
are valid messages. The host and surrounding controls remain mounted.

`size="content"` (default) follows content and may move adjacent layout. With
`size="reserve"`, provide every known string in `alternatives`; hidden grid cells
reserve the largest rendered alternative at the current width and font. Unknown
values can exceed that reservation. `size="fixed"` requires caller CSS dimensions
on the host (fixed mode supplies `display: inline-block` before caller styles); `overflow="clip"` (default) or `"visible"` makes overflow explicit.
Reserve and fixed use absolutely positioned visual layers so exits cannot change
the reserved geometry. CSS performs sizing without stale cached font measurements.

Each host exposes one complete visually hidden text node; decorative layers are
`aria-hidden`. `live="off"` is the default; `"polite"` or `"assertive"` opts the
single semantic message into live announcements. Use the default span inside a
button or label to preserve the native control. Interactive rich text is unsupported.

SSR and initial hydration render identical unsplit, visible text. Segmentation is
a post-mount enhancement, so differing server/browser ICU versions cannot produce
hydration mismatches. `Intl.Segmenter` segments words and grapheme clusters in the
explicit locale. If it is unavailable, keep the entire string intact rather than
splitting emoji, combining sequences or unfamiliar scripts. Whitespace remains
literal text, with inherited CSS white-space rules; wrapping occurs at natural word
boundaries. Graphemes stay grouped within each word. Line measurement is outside
this API; fragment boundaries may affect font ligatures and complex-script shaping.

Inherited `MotionConfig` policy is authoritative, including explicit `never`.
Live application/device changes settle all text motion promptly. Hidden Activity
releases viewport/policy observers and cancels owned playback; visible content
settles and can animate on a later trigger. Teardown invalidates completion work.

For signatures, use existing `motion.path` with `pathLength`; see
`src/lib/site/examples/SVGExample.svelte`. This pass adds no drawing engine.
