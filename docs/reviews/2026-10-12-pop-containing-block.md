# Retained exits and changing containing blocks

Owner feedback reproduced on the protected SessionCards example at 0b2355a:
the outgoing paragraph moved about 54px down and 20px right, below the button,
and its width was recaptured after reflow. A projection transform made the
previously static body the absolute containing block. The pop rule still used
offsets relative to the card; a changed offsetParent also discarded the saved box.

The runtime now preserves the first-owned dimensions while the DOM parent remains
unchanged and captures border-edge offsets relative to that parent. It converts
those offsets into the current containing block before projection measurement,
after synchronous projection commits, and after animation renders. Only retained
exits own the frame callback and measurement registry; revival/unmount disposes
both. CSSOM rule updates avoid feeding the DOM mutation observer. No ancestor CSS,
public APIs, engine version, or consumer state requirements change.

An independent nonimplementing reviewer found another confirmed blocker in the
initial draft: a child without projection could move 22px right and 52px down when
a parent update ran during Motion postRender. Measuring only the ancestor did not
schedule the child's correction before the next paint. One coalesced microtask
now refreshes all active exits after the synchronous commit. The same independent
probe passes with zero vertical/width error; removing that bridge makes the new
regression fail by 22px. Natural-playback coverage remains separate.

WebKit exposed a second coordinate case: a fixed-width normal-flow RTL paragraph
had a used left margin of 115px (9px authored plus 106px unused inline space),
which became 9px when absolute. Capturing margin-relative offsets lost 106px.
Capturing border edges and subtracting current absolute margins fixes this without
changing RTL semantics or freezing margins.

The reviewer also checked all eight direction/anchor combinations with borders
and scrolling, both stacked-owner cleanup orders, cancellation before flush,
restored authored attributes, and zero late CSSOM writes after disposal. In-memory
presence-only bundles contained no rendered projection or React modules. These
focused results do not replace final installed-package qualification.

Regression coverage includes natural exits that outlast the ancestor animation,
children with/without projection, actual SessionCards, reversal/unmount, moving
and scrolled ancestors, physical anchor rebasing, and the between-frame commit.
The actual package consumer fixtures carry the same nested retained-paragraph
scenario using public imports only, in both plain Svelte and SvelteKit.

Evidence and all failed diagnostic attempts are preserved at
`/workspace/releases/astra-motion/layout-runtime-feedback-2026-10-12/`.
The initial actual-example test incorrectly required a fixed page position while
responsive card stacking or Firefox heading wrapping moved its destination. It
now reproduces the desktop row, requires first-frame origin continuity and checks
later samples against the measured heading-driven destination; dimensions and
geometry tolerances are unchanged. The cleanup fixture uses a longer exit so its
late reversal occurs before removal at WebKit's 30Hz frame cadence.
