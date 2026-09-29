# Website content map

The website follows one path: understand Astra, build one interaction, combine it into an interface. Keep the existing paper, ink and coral visual language; use concrete labels instead of decorative arrows.

The documentation sidebar has six sections and 34 pages. `src/lib/site/docs.ts`
sets their order; typed content modules keep each concept in its primary home.

| Section       | Responsibility                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Animations    | Overview, layout, scroll, SVG and transition techniques                                                |
| Gestures      | Overview, drag and hover techniques                                                                    |
| Components    | Complete motion, Activity, Presence, View, LayoutGroup, LazyMotion, MotionConfig and Reorder contracts |
| Motion Values | Value ownership, composition, events, scroll, springs, time, transforms and velocity                   |
| Hooks         | Scoped animation, frames, drag controls, visibility and reduced-motion lifecycles                      |
| Guides        | Getting started, accessibility, actual bundle measurements and text workflows                          |

Home explains Astra with one representative interaction and links to Getting started.
`/docs` opens that guide. The examples catalogue leads to dedicated runnable example
pages, each linked to its primary reference. Larger existing compositions remain here
and in Fieldwork. Legacy documentation routes and useful section anchors stay valid.

## Content rules

- The typed registries collected by `src/lib/site/examples.ts` own each focused example’s title, description, category, guide anchor, short excerpt, live component and complete source. `exampleCatalog` derives its entries from this map.
- Each focused reference example belongs to one section in `docs.ts`. Larger compatibility compositions remain in the examples catalogue and link to their primary concept without duplicating the focused reference demo. Recipe IDs never select a different live component implicitly.
- Excerpts explain the key mechanism and are labelled as excerpts. Complete source comes from the exact running component, with public package imports. The source consumer check compiles and type-checks those files and complete inline examples. `public-example-source.ts` is the canonical public-import transformation.
- Prefer `motion.tag` with top-level animation props for new markup. Keep compatibility syntax and precedence in the motion reference’s native-bindings section. Introduce `motion.bind` for existing native markup; `createMotion` has been removed. A guide must explain which contract its source uses.
- Preserve useful deep links with section aliases when moving content. Canonical catalogue links point to the actual preview; they never require a second search.
- Reusable examples are mounted in isolated roots. Reset and guide navigation dispose their retained exits immediately.
- Do not add ornamental Unicode arrows to labels, controls, CSS content or shown source. Directional controls use words; keyboard event names remain unchanged.
