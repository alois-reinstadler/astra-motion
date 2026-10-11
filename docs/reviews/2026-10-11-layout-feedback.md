# Owner layout feedback — 11 October 2026

Follow-up to consolidated baseline `0adf57f4a5818fa7d9b50f14543d8fbdb9ab8cc7`.
The owner reported delayed session-card text/closing and slow, distorted text in
the minimal LayoutGroup snippet on the live documentation pages.

## Causes and correction

SessionCards explicitly captured and held card dimensions until a 180ms detail
exit completed. Its parent spring differed from the protected child's default
layout timing. Two expanded 380px flex items also wrapped in the 700px docs column,
adding a large positional move to the comparison. Removed the application-owned
hold and used existing popLayout to collapse while detail fades. Shared one layout
spring through MotionConfig, protected the right card's heading/button as well as
body, and kept stable responsive grid columns. The unprotected card still visibly
stretches as intended. Immediate collapse may clip outgoing detail; the separate
readable-note example still deliberately sequences fade then collapse.

The minimal LayoutGroup snippet used the default 450ms layout timing and plain
text descendants inside scaling details elements. Added position-only motion
summary/paragraphs and one shared 240ms ease-out transition. The native details
semantics remain. Updated displayed source, runnable source and explanatory prose.
No runtime, public API, engine, dependencies or package inputs changed.

## Verification

- Affected browser suites: 15 checks per engine, all 45 passing across Chromium,
  Firefox and WebKit. Final strengthened editorial regressions passed again in
  all engines (six each). Tests exercise natural playback, prompt collapse,
  protected glyph dimensions, attached text, reversal and exit/projection cleanup.
- All three focused regressions fail against original baseline components.
  Original held close still authors roughly 380px where the immediate target is
  240px; the original group changes glyph height by approximately 10.38px, against
  the unchanged 0.5px requirement. These expected failures are retained separately.
- Live desktop card measurements: close begins moving around 33ms while detail
  remains present; protected glyph error zero, maximum measured text inset error
  0.013px. Reopen/reclose ends at both 240px with no retained detail.
- Live minimal group: 44 natural frames, 16 transformed frames, maximum glyph
  error below 0.00004px; settled by the sample at 310ms. Native activation opens;
  keyboard Enter closes. Mobile card reversal: 85 frames, final 240px cards,
  zero retained detail and no document overflow at 393px.
- Svelte check: zero errors/warnings. Documentation server checks: 14 passed.
  Guide/snippet check, Svelte autofixer, changed-file ESLint and formatting pass.

An initial cleanup assertion sampled at about 550ms before the 600ms spring had
finished; it now polls the boolean cleanup state. An older eight-frame contrast
sample missed the moving phase in WebKit. The replacement natural-playback test
samples 75 frames through reversals and checks actual protected and unprotected
glyph dimensions as well as projection activity. Geometry thresholds are not
relaxed. Temporary baseline fixtures and expected-failure logs are separate from
acceptance; no application assertions or source suites are skipped for this fix.

Evidence: `/workspace/releases/astra-motion/layout-feedback-2026-10-11/`.
The earlier release archive, review reports and qualification evidence remain
unchanged. These scoped site checks do not claim a new complete production or
packed-consumer release qualification. The owner should inspect both updated live
docs examples, including the deliberately unprotected card and clipping tradeoff.
