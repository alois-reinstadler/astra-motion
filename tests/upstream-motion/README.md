# Upstream engine probes

These are Astra-authored compatibility and defect characterizations against the pinned, unadapted Motion engine. They are **not imported upstream tests**. Private-shape checks here protect reviewed adapter shims; expected defects are prompts to reassess a shim when Motion changes, not desired Astra behavior.

Adapted upstream public-behavior tests and provenance live in [Motion baseline](../motion-baseline/README.md). Keep both layers: they answer different questions.

Modern native re-entry into infinite while-present animation relies on the pinned
`animationState.getState().animate.prevResolvedValues` shape to invalidate the
unchanged animate target without resetting gesture or initial-render state.
The contract probe checks this shape; the native re-entry browser regressions
check initial:false, retained identity, continuing playback, gestures and cleanup.
