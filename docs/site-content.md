# Website content map

The website follows one path: understand Astra, build one interaction, combine it into an interface. Keep the existing paper, ink and coral visual language; use concrete labels instead of decorative arrows.

| Page                           | Reader task                            | Example and code                                                                                                                       |
| ------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Home                           | Understand what Astra animates         | One grid/stack/reorder playground. The explanation and short excerpt describe that exact component; complete source is optional.       |
| Documentation overview         | Choose a learning path                 | Reading map, no repeated demo or implementation inventory.                                                                             |
| Getting started                | Install and make the first component   | Local-package installation, then the notification. Show the essential code and offer its complete styled component separately.         |
| Animation state                | Change targets and coordinate feedback | Reactive target excerpt, staggered menu, button/drag feedback. Link back to the notification for enter/exit basics.                    |
| Presence & exits               | Replace content and remove items       | Wait/sync cards and removing list items with reflow.                                                                                   |
| Automatic layout               | Animate changes made by CSS            | Expanding player, with position-only content compensation.                                                                             |
| Shared elements & groups       | Connect a selection across elements    | Shared highlight between tabs.                                                                                                         |
| Scroll-linked motion           | Connect progress and visibility        | Pinned composition and a card entering its scroll viewport.                                                                            |
| Scoped timelines               | Sequence and control a scene           | Play/pause/replay composition.                                                                                                         |
| SvelteKit routes               | Enhance navigation                     | Complete route setup and shared-element snippets, with an explicit link to the two-page diagnostic demo.                               |
| Your components                | Integrate existing markup              | Native bindings, form controls, reusable components and headless integration.                                                          |
| Defaults & reduced motion      | Establish application policy           | Provider setup and interaction responsibilities.                                                                                       |
| API / Troubleshooting / Status | Look up contracts and limits           | Detailed options, package entries, engine qualification and known boundaries. Keep these out of the first-component path.              |
| Examples                       | Find a behavior to build               | Task catalogue generated from the live example registry, linking directly to canonical guide sections; one complete-application entry. |
| Showcase                       | Understand composition                 | Fieldwork’s four application scenes, precise guide links and working repository source on demand.                                      |
| Laboratory                     | Diagnose integration boundaries        | Existing stress scenes and source fixtures, clearly separate from beginner guides.                                                     |

## Content rules

- `src/lib/site/examples.ts` owns each focused example’s title, description, category, guide anchor, short excerpt, live component and complete source. `exampleCatalog` derives its entries from this map.
- `docs.ts` explicitly assigns each live example once. Recipe IDs never select a different live component implicitly.
- Excerpts explain the key mechanism and are labelled as excerpts. Complete source comes from the exact running component, with public package imports. The source consumer check compiles and type-checks those files.
- Prefer `motion.tag` with top-level animation props for new markup. Keep compatibility syntax and precedence in the API reference’s component-props section. Introduce `createMotion` where existing native markup or a lower-level integration needs it. A guide must explain which contract its source uses.
- Preserve useful deep links with section aliases when moving content. Canonical catalogue links point to the actual preview; they never require a second search.
- Reusable examples are mounted in isolated roots. Reset and guide navigation dispose their retained exits immediately.
- Do not add ornamental Unicode arrows to labels, controls, CSS content or shown source. Directional controls use words; keyboard event names remain unchanged.
