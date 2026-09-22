# Packed-consumer lifecycle qualification

This qualification runs a separately installed `astra-motion` tarball in a SvelteKit application using adapter-node. Its fixtures import only the package's public exports. They do not resolve the repository's source aliases or borrow its development server.

The executable evidence is produced by `scripts/qualify-motion-lifecycle.mjs`. Results below must be read alongside its JSON artifact; a missing browser or missing native feature is not a successful test of that feature.

## Reproduce

Prepare the isolated packed consumer with `node scripts/prepare-motion-consumer.mjs`, build it, and start its adapter-node output. Then run:

```sh
node scripts/qualify-motion-lifecycle.mjs \
  --url "$PRODUCTION_LOCAL_URL" \
  --consumer /tmp/your-installed-astra-consumer \
  --dev-url "$CONSUMER_DEV_LOCAL_URL" \
  --output /tmp/astra-production-lifecycle.json
```

Both servers are supplied by the caller. Set the URL variables to the actual allocated local origins. Locally, use `dev-preview` for the built consumer and a separate `dev-preview start astra-motion-consumer-hmr --cwd /path/to/copied-consumer -- pnpm exec vite dev --host '{host}' --port '{port}' --strictPort` for HMR; `--strictPort` prevents a silent port change. Supply `--consumer` and `--dev-url` together, or omit both to record HMR as not run. The runner edits only the isolated consumer's `HmrTile.svelte` and restores it in `finally`. It launches browser engines but never a server; run it only where browser launches are permitted. Never pass the repository template as `--consumer`.

The source fixtures are in `tests/production/consumer/src/routes/lifecycle`. Root development builds, sync commands and HMR edits must not run against a browser suite's own app; the isolated consumer avoids that previous source of false navigation failures.

## What constitutes a real BFCache result

A SvelteKit client navigation is not a BFCache restoration. The test uses a full-document link (`data-sveltekit-reload`) to another document, then browser Back. It requires all of:

- An actual browser `pageshow` event with `persisted === true`.
- The same randomly generated document/heap marker before departure and after restoration.
- Preserved interactive component state.
- No remaining temporary shared-element names after `pagehide` cleanup.
- Working state animation and a fresh shared-route transition after restoration.

A second case leaves while a genuine native View Transition is active, restores the document, and verifies the route coordinator removed temporary names. The runner delegates to the browser's original `startViewTransition`; it records source/destination names and promise outcomes, and does not fabricate lifecycle events or replace the transition engine.

Playwright's installed Chromium launcher includes `--disable-back-forward-cache` by default. The BFCache run removes that one default argument and uses its full Chromium channel, rather than accepting the default automation behavior as a library failure. Chrome's `Page.backForwardCacheNotUsed` CDP events are collected for diagnostic failures. No cache hit is inferred merely from fast navigation or `pagehide.persisted`.

This distinction follows Chrome's [BFCache guidance](https://web.dev/articles/bfcache) and [DevTools BFCache diagnostics](https://developer.chrome.com/docs/devtools/application/back-forward-cache/).

## Streamed route content has a capture boundary

The adapter-node fixture returns a deferred promise that resolves after 900 ms. A response reader verifies pending SSR markup arrives substantially before the final data chunk. This is real streamed HTML, not a client timer pretending to be server loading.

Three route contracts are measured in each installed browser engine:

1. **Late identity:** the destination `routeShared` element only mounts after the deferred promise resolves. It cannot participate in the already captured navigation. The later content remains functional and can be a source on the next navigation; Astra does not initiate an unsolicited second route transition.
2. **Reserved host:** a stable `routeShared` host renders immediately with the intended dimensions. Its contents resolve later. That host is present at capture and can share identity with the source.
3. **Awaited essential data:** the server awaits the content before route commitment. The actual destination participates in the initial capture.

This is a browser snapshot boundary, not a reason to wait for every streamed promise. Reserve geometry/identity for a shared image, or await the data essential to that shared element. Stream unrelated content normally. SvelteKit's [streaming documentation](https://svelte.dev/docs/kit/load#Streaming-with-promises) explains why deferred server promises can render after navigation.

## HMR ownership and cleanup

The isolated dev fixture repeatedly edits a component while both state motion and scoped playback are active. It requires a component update without a full-document reload, exactly one live component owner, a functioning retargeted Motion binding, and no animations remaining on the detached scoped target after route destruction. The test does not equate HMR with a production mount, and it does not promise preservation of arbitrary local state across script edits.

## Physical Safari and iOS availability

Environment inspection found Linux under WSL2 (`x86_64`, Microsoft WSL kernel). `safaridriver`, `xcrun`, `idevice_id`, and `ios_webkit_debug_proxy` are not installed; no USB device bus is exposed to this session. A Windows Chrome binary exists on the mounted host, but that does not provide Safari. The enabled browser connector exposes Chromium automation; no physical Apple device or remote Safari session is available through the callable tools.

Therefore **physical Safari and iOS are not tested here**. Playwright WebKit is useful engine coverage but is not evidence for Safari's macOS/iOS integration, touch hardware, mobile browser chrome, GPU behavior, or operating-system navigation gestures. No account, credential, subscription, or paid device session was created.

## Results

The 2026-09-05 run passed **13/13 checks** against the freshly packed and independently installed consumer at `/tmp/astra-motion-production-a2BJGU/consumer`. The adapter-node production server ran on port 5290; HMR used a separate dev process on 5291.

| Qualification                             | Observed result                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Actual Chrome BFCache restoration         | `pageshow.persisted === true`, same heap marker, interactive count preserved, no BFCache rejection events             |
| State and routes after restoration        | State retarget completed; fresh shared-route capture paired source and destination successfully                       |
| Departure during active native transition | Transition confirmed active before navigation; document restored from BFCache; zero temporary names after restoration |
| Real adapter-node streaming               | Pending HTML at 9 ms; deferred data completed at 908 ms; 2,786 response bytes                                         |
| Late destination identity                 | No destination in initial capture; deferred element appeared successfully; no unrequested second transition           |
| Reserved destination host                 | Exactly one destination captured, matching the source identity                                                        |
| Awaited essential destination             | Exactly one complete destination captured, matching the source identity                                               |
| Component HMR                             | Three script/markup revisions during animation; same document; one live owner after each; subsequent retargets worked |
| Scope destruction                         | Zero live fixture owners and zero animations on the detached scoped target after route departure                      |

The nine content-capture cases passed in Chromium **151.0.7922.34**, Firefox **153.0**, and Playwright WebKit **26.5**. All three exposed native View Transitions in these installed builds. The two actual BFCache proofs were run in full Chromium, and HMR was exercised in Chromium. This does not claim physical Safari/iOS BFCache or HMR coverage.

Machine-readable evidence: [production-lifecycle-results.json](./production-lifecycle-results.json); complete execution log: `/tmp/astra-production-lifecycle-final.log`. The production fixture was also opened with agent-browser, visually inspected in `/tmp/astra-production-lifecycle.png`, and had no browser errors.

An initial active-transition assertion was corrected in the harness: an init-script listener's microtask can run before later native event listeners, so it was observing names before Astra's `pagehide` listener. The final observer is registered after hydration and runs after cleanup. Both the real restored DOM and the correctly ordered event observation are now checked. No runtime change was needed for these lifecycle results.
