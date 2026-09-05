# A tour for hands-on testing

Start at `/showcase`. Fieldwork contains four working scenes; each has a source
viewer with the actual component and companion files. The top navigation connects
the showcase, searchable examples and topic guides.

## Fieldwork

1. **Collect:** switch between comfortable and compact grids, filter Land/Water,
   then open a photograph before the grid settles. Step through photographs and
   return with Escape. Repeat quickly. Images should retain their 3:2 crop, text
   should remain proportional, and keyboard focus should return to the opener.
2. **Compose:** edit the headline and deck, dock the inspector left/right, switch
   Story/Cover, and hide/show the inspector during a resize. Your edits should
   survive. Watch the headline, image and shared tab highlight during movement.
3. **Curate:** reverse the queue repeatedly, switch density, remove a moving row,
   and immediately undo. Siblings should fill the gap while the removed row exits.
   Reorder with the keyboard; focus should follow the retained control. Add the
   remaining photograph from the light table.
4. **Read:** scroll the journal forward and backward, resize the window, then play,
   pause, resume and rapidly replay the opening title. The reading meter should
   reflect the current scroll position and the opening should finish once.
5. Enable **Reduce motion** while something is moving. Repeat the controls, then
   disable the override. The default follows your operating-system preference.

Try the same tour with a narrow window. Open the source viewers and follow their
guide links; ordinary navigation should remain usable without waiting for motion.

## Go deeper

| URL                       | What to exercise                                                                  |
| ------------------------- | --------------------------------------------------------------------------------- |
| `/motion-lab/product`     | Shared images between routes; link navigation, back/forward and rapid navigation. |
| `/motion-lab/components`  | Actual shadcn accordion, dialog and cards with optional motion bindings.          |
| `/motion-lab/presence`    | Sync, wait, popLayout and coordinated native exits.                               |
| `/motion-lab/updates`     | Ordinary assignments versus explicit `layout.update()` transactions.              |
| `/motion-lab/extended`    | Large layout changes, nested content and rapid stress controls.                   |
| `/motion-lab/inheritance` | Variant inheritance and per-component configuration.                              |
| `/motion-lab/scroll`      | Container/target scrolling, offsets and reduced motion.                           |
| `/motion-lab/timelines`   | Scoped sequences and playback controls.                                           |

For a useful bug report, record the route, browser version, motion preference,
window size and shortest sequence of clicks that reproduces it. A short recording
is particularly useful for intermediate text/image distortion: a settled screenshot
often misses it.

The [aftercare report](research/aftercare-and-site.md) separates verified behavior
from remaining release and browser limitations.
