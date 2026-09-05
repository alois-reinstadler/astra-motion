# User-reported content distortion

The user identified visible defects that the earlier container geometry assertions
missed: section 03 accordion text stretched on open/close; section 06 artwork changed
aspect on detail open; section 07 labels stretched during large layout changes. They
also reported a white trail behind the section 03 arrow, investigated separately.

## Reproduction and cause

Independent `resize-content.svelte.spec.ts` regressions measured actual text ranges
and artwork geometry at paused intermediate points of real Motion animations. The
original markup failed all three initial cases:

- Accordion heading glyph height differed by **5.546px** from its settled size.
- Grid label glyph width differed by **6.237px**.
- Shared artwork had a **0.06888 aspect-ratio error**.

The projection engine's parent rectangle was correct. Content still inherited its
scale. The accordion heading was registered but `display:inline`, which cannot apply
a CSS counter-transform; its newly inserted paragraph was unregistered. Grid labels
and remove buttons were unregistered. Shared artwork projected a frame from 122×100
to 272×170, then stretched an unregistered glyph inside it. A block nested-child test
could pass while all these visible content defects remained.

## Fix

The surface continues to animate width and height through Motion projection. Text
uses its own position projection, canceling projected ancestor scale. The existing
accordion heading is block-level; paragraphs, grid labels and controls participate
without inserted runtime wrappers. The shared demo now uses an actual intrinsic 6:5
image with its own shared identity and preserve-aspect projection inside the independently
resizing artwork frame. Motion supplies both the counter-scale and uniform image
projection. There is no custom inverse-scale engine or global position-only fallback.

The same content contract is documented in the public API examples. Direct raw text
inside a size-projected surface still needs a transformable content host; the adapter
does not scan, wrap or mutate arbitrary user descendants. Each extra content projection
has a measurement cost. The grid control now says Items, because each item includes
multiple projection participants.

## Verification

Six tests, **18/18 cases across Chromium, Firefox and WebKit**, cover:

- Existing heading and newly mounted paragraph during accordion expansion.
- Heading during accordion collapse.
- Grid number and remove-button glyphs during column width projection.
- Reorder interrupting that width projection.
- Shared image aspect during both open and close.

Tests pause/seek real Motion controls, require a nonidentity parent projection, compare
glyph width/height within 0.5px, and require the 6:5 image to change size by more than 5px
while preserving aspect. They then seek the controls to their settled geometry.
They do not assert only final transforms or hide failures with longer delays.

Separate actual-route probes found no nonuniform image/title scaling in native View
Transitions across Chromium, Firefox and WebKit at desktop/mobile widths. Snapshot
horizontal/vertical scaling differed by less than 0.03%, consistent with rounding.
No speculative route CSS change was made.

The white arrow trail is not covered by these content fixes. Its CSS has no shadow,
filter or pseudo-element; a paused Chromium raster capture was clean. The user confirmed Chrome and explicitly deferred this artifact. It remains
unresolved; it is not claimed fixed by the content changes.

The complete reconciled local suite passes **144/144 cases** across the three engines
after these markup changes.
