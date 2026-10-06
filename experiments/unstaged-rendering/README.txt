Unstaged lifecycle research — intentionally not part of the library build.

Run from repository root:
  node experiments/unstaged-rendering/run.mjs

Uses installed dependencies; generates .generated/ and results.json. Requires
Chromium. Set BROWSER_EXECUTABLE_PATH to override /usr/bin/google-chrome.
Set PROBE_RESULTS=/absolute/path/results.json to preserve committed evidence.

The original 24 Chromium tests compare unchanged managed components, a private Batch.flush
hook, and post-compile callback instrumentation. Tests explicitly assert retained
302px, reorder suppression, and mutation-capture failures; a passing suite is not universal parity.

See docs/research/unstaged-interception-probes.md for findings and limitations.

Additional Motion-only native-write and eager-state experiments are documented in
WRITE-PROBES.md. Their retained failure controls are not parity successes.
React reference exports reuse experiments/staged-rendering/node_modules (React 18.3.1).
