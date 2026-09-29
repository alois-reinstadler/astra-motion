import type { DocPage } from '../doc-types.js';

export const coreDocs: DocPage[] = [
	{
		slug: 'animations',
		title: 'Animations overview',
		group: 'Animations',
		summary:
			'Describe a destination, let values travel there, and coordinate the movement across your component tree.',
		sections: [
			{
				id: 'first-animation',
				title: 'Animate a changing target',
				text: [
					'Import motion from astra-motion and put an animate target on the element you want to move. A target is an object of CSS properties, independent transforms, or supported SVG attributes. When a reactive value changes, Astra animates from the current rendered value to the new destination.',
					'Svelte state describes your interface. MotionValues carry values that change every frame. You can start with ordinary $state and introduce MotionValues when connecting gestures, scroll, or derived values. Component destruction releases Astra’s subscriptions and animation work.'
				],
				code: {
					label: 'Small complete component',
					source:
						"<script lang=\"ts\">\n  import { motion } from 'astra-motion';\n  let expanded = $state(false);\n</script>\n\n<button onclick={() => expanded = !expanded}>Change target</button>\n<motion.div animate={{ scale: expanded ? 1.2 : 1 }} style={{ width: 80, height: 80, backgroundColor: '#d34123' }} />"
				},
				related: ['motion', 'motion-values']
			},
			{
				id: 'entrances',
				title: 'Choose an initial appearance',
				text: [
					'initial sets the first rendered values, including server-rendered HTML. The initial target animates to animate after the component mounts. With no initial target, the element starts from its authored styles or its browser-computed appearance. initial={false} renders the final animate values immediately and suppresses the first entrance.',
					'An array supplies keyframes: animate={{ opacity: [0, 1, 0.6] }} visits each value. A null first keyframe reads the current value, which makes replay and interruption start smoothly. Set transition.times to position each keyframe on a zero-to-one timeline; its length must match the keyframe list.'
				],
				related: ['transitions']
			},
			{
				id: 'variants',
				title: 'Name states and coordinate descendants',
				text: [
					'Variants name related targets. Pass variants={{ closed: {...}, open: {...} }} and animate="open". A descendant with matching variant names follows the nearest controlling ancestor. Labels can be arrays; later labels override earlier properties. inherit={false} disconnects a component from inherited variant state.',
					'A variant function receives custom data, the current values, and current velocities. Return a target with optional transition and transitionEnd. A parent can delay or stagger children and run before or after them. Change the selection quickly in this example to see each item continue from its current position.'
				],
				example: 'variants',
				related: ['transitions', 'animate-presence']
			},
			{
				id: 'composition',
				title: 'Combine targets, gestures and visibility',
				text: [
					'Astra resolves animation state per property. The order from lowest to highest priority is animate, whileInView, whileFocus, whileHover, whileTap, whileDrag, then exit. A higher state only overrides the keys it defines. Releasing it restores the next active state for those keys.',
					'Use layout for changes to size and position produced by CSS, including reordering or changing a grid. Use animate for explicit values. Use a retained presence boundary when conditional removal needs sequencing or manual completion. Native View Transitions capture whole views and use an explicit state transaction.'
				],
				related: ['gestures', 'layout', 'animate-presence', 'animate-view']
			},
			{
				id: 'lifecycles',
				title: 'Reactivity, interruption and cleanup',
				text: [
					'Direct props react to Svelte assignments and nested state changes. Keep component identity stable so updates can interrupt an existing animation; changing a key creates a new instance. MotionValues keep their own velocity and can animate styles without rendering the whole Svelte component each frame.',
					'Callbacks belong to the current animation definition. Rapid replacement cancels stale orchestration and transitionEnd writes. An exit that waits forever will retain its presence record forever, so use finite exit transitions. For imperative sequences and automatically managed scope cleanup, use useAnimate.'
				],
				related: ['use-animate', 'use-motion-value-event']
			},
			{
				id: 'accessible-motion',
				title: 'Use motion to explain state',
				text: [
					'Set MotionConfig reducedMotion="user" near the application root. With that policy, transform and layout travel settle immediately while paint animations such as opacity can continue. Keep meaning in text, state and semantic controls so the interaction works with animation disabled.',
					'If a target does not move, check that the element can transform, the value is animatable, and a higher-priority gesture is not controlling the same property. Inline text needs an inline-block or block host. A raw transform takes precedence over independent x, y and rotate values; transformTemplate provides explicit composition.'
				],
				related: ['accessibility', 'motion', 'transitions']
			}
		]
	},
	{
		slug: 'svg',
		title: 'SVG animation',
		group: 'Animations',
		summary:
			'Animate vector attributes, draw paths, transform shapes, and connect SVG coordinates to pointer gestures.',
		sections: [
			{
				id: 'usage',
				title: 'Animate an attribute or a line',
				text: [
					'SVG motion elements accept native SVG attributes alongside animation props. Numeric geometry such as cx, cy and r belongs in animate when it should move between values. Keep viewBox and accessible naming on the svg root. The example combines a line-drawing target with a circle’s position and radius.',
					'Use pathLength, pathSpacing and pathOffset as normalized progress values. A pathLength of one draws the full path; zero draws none. The same drawing properties work on circle, ellipse, line, polygon, polyline and rect. Astra renders the SVG attributes during SSR so an initial drawing state does not flash.'
				],
				example: 'svg-drawing',
				code: {
					label: 'Small complete SVG',
					source:
						'<script lang="ts">\n  import { motion } from \'astra-motion\';\n</script>\n<motion.svg viewBox="0 0 100 100" width="120" role="img" aria-label="A growing circle">\n  <motion.circle cx={50} cy={50} initial={{ r: 10 }} animate={{ r: 35 }} />\n</motion.svg>'
				}
			},
			{
				id: 'attributes',
				title: 'Attributes, styles and MotionValues',
				text: [
					'Place CSS properties and CSS MotionValues in style. Place SVG attribute MotionValues directly on the attribute: <motion.circle cx={x} style={{ opacity }} />. Replacing a value updates its subscription; destruction releases it without destroying a MotionValue owned elsewhere.',
					'x, y and scale in animation targets are transform aliases. Use attrX, attrY and attrScale when you mean the SVG attributes with those names. Ordinary attributes and event handlers continue to work. bind:ref receives the real SVG node, such as an SVGCircleElement.'
				],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'cx, cy, r, rx, ry, d, points, viewBox and native attributes',
							'SVG attribute types, with MotionValues where supported',
							'Native attributes remain attributes. animate supplies interpolated targets.'
						],
						['x / y / scale', 'number or keyframes', 'Independent CSS transforms.'],
						[
							'attrX / attrY / attrScale',
							'number, string, MotionValue or animated target',
							'Unambiguous native SVG attribute channels.'
						],
						[
							'pathLength / pathSpacing / pathOffset',
							'normalized progress',
							'Draw length, spacing and segment offset.'
						],
						[
							'style.transformBox',
							'fill-box behavior for local transforms',
							'Set view-box to restore SVG viewport-relative geometry.'
						]
					]
				},
				related: ['motion-values', 'use-transform']
			},
			{
				id: 'transforms',
				title: 'Move around the shape’s own origin',
				text: [
					'Astra follows Motion’s SVG transform behavior: independent transforms normally use the shape’s local box. Set style={{ transformBox: "view-box" }} when the transformation should be relative to the viewBox. transformOrigin can define an explicit origin.',
					'A motion.svg can animate viewBox to pan or zoom a drawing. Use the same four-number string format at both ends. Paths can morph when their d strings have compatible commands and numeric structure. Arbitrary incompatible paths need a deliberate mixer; the library does not guess a geometric correspondence.'
				],
				related: ['transitions']
			},
			{
				id: 'dragging',
				title: 'Correct viewBox pointer coordinates',
				text: [
					'Pointer movement arrives in page pixels. An SVG viewBox can scale or offset its internal coordinate system. Pass transformViewBoxPoint(() => svg) through MotionConfig and bind:ref on the svg root; the helper reads its current screen transform for each coordinate conversion.',
					'For a transformed HTML ancestor, correctParentTransform(() => parent) performs the corresponding correction. Use one mapping for the active coordinate system and remember that constraints are measured in that same corrected space.'
				],
				code: {
					label: 'Complete SVG drag component',
					source:
						'<script lang="ts">\n  import { motion, MotionConfig, transformViewBoxPoint } from \'astra-motion\';\n  let svg = $state<SVGSVGElement | null>();\n</script>\n<MotionConfig transformPagePoint={transformViewBoxPoint(() => svg)}>\n  <motion.svg bind:ref={svg} viewBox="0 0 100 100" width="200" height="200" aria-label="Draggable circle">\n    <motion.circle cx={50} cy={50} r={12} drag dragMomentum={false} />\n  </motion.svg>\n</MotionConfig>'
				},
				related: ['drag', 'motion-config']
			},
			{
				id: 'considerations',
				title: 'Namespaces, accessibility and troubleshooting',
				text: [
					'Astra supplies compiled SVG tags, including camel-cased names such as linearGradient and foreignObject. HTML content inside motion.foreignObject uses HTML semantics. For ambiguous names such as a or title, use a motion.svg ancestor or an explicit SVG namespace when creating a custom tag.',
					'Describe meaningful illustrations with an accessible name or nearby text. Decorative SVG should be hidden from assistive technology. A draggable graphic needs another way to perform an essential action. Reduced positional motion does not automatically rewrite path-drawing or morphing targets; use useReducedMotion to choose a simpler graphic when needed.',
					'SVG layout projection is not a replacement for animating geometry attributes. Use an HTML layout host around the drawing when its position in the page needs shared-layout animation. If a path does not morph, compare command sequences and keyframe units first.'
				],
				related: ['accessibility', 'use-reduced-motion', 'layout']
			}
		]
	},
	{
		slug: 'transitions',
		title: 'Transitions',
		group: 'Animations',
		summary:
			'Control duration, spring response, keyframe timing, repetition and sequencing with one transition vocabulary.',
		sections: [
			{
				id: 'usage',
				title: 'Choose how a target is reached',
				text: [
					'A transition describes movement between values. Set transition on a motion component for its default, inside a variant or target for that state, or through MotionConfig for a subtree. A specific property entry overrides the general transition; default supplies the fallback for the remaining properties.',
					'A tween follows a duration and easing curve. A physics spring responds to displacement and current velocity, which makes interruption natural. A duration-based spring trades physical parameters for a chosen duration and bounce. Try changing the transition before reversing the tile.'
				],
				example: 'transition-picker',
				code: {
					label: 'Focused per-property transition excerpt',
					source:
						'<motion.div\n  animate={{ x: 100, opacity: 1 }}\n  transition={{ default: { type: "spring", stiffness: 180, damping: 20 }, opacity: { duration: 0.2 } }}\n/>'
				}
			},
			{
				id: 'defaults',
				title: 'Understand the defaults',
				text: [
					'With no transition, Motion chooses by property. Ordinary two-value properties use a 0.3-second eased animation. Transform properties use a spring; scale has its own spring tuning. More than two keyframes use a 0.8-second keyframe animation. Supplying transition options can select a different engine path, so specify the type when the distinction matters.',
					'The low-level spring generator’s defaults differ from the component’s automatic transform preset. Explicit physical spring options start from stiffness 100, damping 10 and mass 1. A component with no transition uses the engine’s transform presets (stiffness 500/damping 25, or scale stiffness 550 with target-dependent damping).'
				],
				related: ['use-spring', 'motion-config']
			},
			{
				id: 'tween',
				title: 'Tween and keyframe options',
				text: [],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'type',
							'automatic; "tween", "keyframes", "spring", "inertia", or false',
							'Choose the engine. false applies values immediately.'
						],
						[
							'duration',
							'seconds; tween 0.3, multiple-keyframe default 0.8',
							'Total duration for a tween or duration-style spring.'
						],
						[
							'ease',
							'named easing, cubic Bézier tuple, function, or array',
							'Controls progress; an array supplies easing per keyframe segment. Names include linear, easeIn, easeOut, easeInOut, circIn/Out/InOut, backIn/Out/InOut and anticipate.'
						],
						[
							'times',
							'evenly spaced',
							'One zero-to-one offset for each keyframe; ordered and matching the number of frames.'
						],
						[
							'delay',
							'0 seconds',
							'Delay start; a negative value starts partway through the animation.'
						],
						['repeat', '0', 'Additional runs, or Infinity.'],
						[
							'repeatType',
							'"loop"',
							'loop restarts, reverse reverses time, mirror swaps origin and destination.'
						],
						['repeatDelay', '0 seconds', 'Pause between repeated runs.']
					]
				}
			},
			{
				id: 'springs',
				title: 'Spring options',
				text: [
					'Physical parameters override duration/bounce tuning. Larger stiffness increases the pull toward the target, damping removes oscillation, and mass changes how readily velocity responds. Zero damping can oscillate indefinitely. Finish an exit with nonzero damping and finite repeat settings.',
					'The qualified engine only enters its visualDuration branch when duration or bounce is also present. Pair visualDuration with bounce, for example { type: "spring", visualDuration: 0.4, bounce: 0.2 }. This avoids relying on a visualDuration-only combination that this upstream version ignores.'
				],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'stiffness / damping / mass',
							'100 / 10 / 1 for an explicit physical spring',
							'Physical spring constants; setting them overrides duration-style resolution.'
						],
						['velocity', 'current value velocity', 'Initial velocity in value units per second.'],
						[
							'bounce',
							'0.3 in duration-style resolution',
							'Bounce amount; physical constants take priority.'
						],
						[
							'visualDuration',
							'seconds; use with bounce or duration',
							'Time until the main visible movement is nearly complete; residual settling can continue.'
						],
						[
							'restSpeed / restDelta',
							'engine values depend on value scale and animation API',
							'Completion requires sufficiently low speed and displacement. Set both for exact settling requirements.'
						]
					]
				}
			},
			{
				id: 'inertia',
				title: 'Inertia and bounded release',
				text: [
					'Inertia starts from velocity and decays toward a predicted destination. Drag uses it on release; dragTransition customizes that release. min and max bound the destination and bounceStiffness/bounceDamping control the boundary spring. modifyTarget can snap the predicted destination to a grid.',
					'A zero-elasticity drag is a hard bound in Astra, including its first release frame. Set dragMomentum={false} when the pointer’s release position should be final. Direction locking and corrected coordinate systems are covered in the Drag reference.'
				],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'power',
							'0.8 in generic inertia',
							'Multiplies initial velocity to predict a target; drag supplies its own release tuning.'
						],
						[
							'timeConstant',
							'325 milliseconds in generic inertia',
							'Controls the rate of velocity decay; drag uses 750ms unless overridden.'
						],
						[
							'min / max',
							'unbounded',
							'Clamp the travel region and introduce a spring at a bound.'
						],
						[
							'modifyTarget',
							'identity',
							'Receives the predicted destination and returns a replacement.'
						],
						[
							'bounceStiffness / bounceDamping',
							'500 / 10 in generic inertia',
							'Spring tuning at constraints; drag config supplies its own defaults.'
						]
					]
				},
				related: ['drag']
			},
			{
				id: 'orchestration',
				title: 'Sequence variants and follow a path',
				text: [
					'when: "beforeChildren" completes the parent before starting its variant children. "afterChildren" waits for children first. The default starts them together. delayChildren accepts seconds or stagger(delay, options). Legacy staggerChildren and staggerDirection remain supported.',
					'stagger accepts startDelay, from (first, last, center or an index), and ease. It calculates a delay for each item. A staggered exit still waits for every registered descendant before presence completes.',
					'For x/y movement, transition.path can use arc(). Layout uses transition.layout.path. Arc defines a curved control point relative to the displacement; its actual midpoint offset is half strength times the travel distance. See Layout for a runnable curved and shared-element example.'
				],
				code: {
					label: 'Focused orchestration excerpt',
					source:
						'const variants = {\n  visible: {\n    opacity: 1,\n    transition: { when: "beforeChildren", delayChildren: stagger(0.06, { from: "center" }) }\n  }\n};'
				},
				related: ['animations', 'layout', 'animate-presence']
			},
			{
				id: 'lifecycle',
				title: 'Retargeting, SSR and troubleshooting',
				text: [
					'Transitions run in the browser; initial values render on the server. Changing a target retargets from the current state, while changing only transition options affects subsequent animations. Choose a new target or replay an imperative sequence to restart it.',
					'Use matching units and compatible value structures across keyframes. A spring that never finishes usually has zero damping, infinite repetition, or unattainable rest criteria. Respect reduced-motion policy and provide a stop control for nonessential repeating motion. Native View Transition geometry uses its browser-layer timing contract; its reference explains which options apply.'
				],
				related: ['animate-view', 'accessibility', 'use-animate']
			}
		]
	},
	{
		slug: 'motion',
		title: '<motion>',
		group: 'Components',
		summary:
			'Use direct animation props on real HTML and SVG elements, with native attributes, events, bindings and custom component roots.',
		sections: [
			{
				id: 'usage',
				title: 'Animate the actual element',
				text: [
					'Import { motion } from astra-motion and choose a tag: motion.div, motion.button, motion.input or motion.path. These are compiled Svelte components that render the named element. Ordinary native attributes and event handlers pass through. bind:ref gives you the actual element.',
					'Changing animate reacts to state immediately. The example changes position, rotation and border radius using one state variable. The same direct props apply to Motion with a stable as tag; compiled motion tags provide more precise native bindings.'
				],
				example: 'motion-component',
				code: {
					label: 'Small complete component',
					source:
						'<script lang="ts">\n  import { motion } from \'astra-motion\';\n  let active = $state(false);\n  let element = $state<HTMLButtonElement | null>();\n</script>\n<motion.button bind:ref={element} onclick={() => active = !active}\n  aria-pressed={active} animate={{ scale: active ? 1.15 : 1 }}>\n  Toggle size\n</motion.button>'
				}
			},
			{
				id: 'animation-props',
				title: 'Animation and state props',
				text: [],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'initial',
							'target, label(s), false; unset',
							'Initial SSR/mount appearance. false renders final animate values and suppresses the first entry.'
						],
						[
							'animate',
							'target, label(s), boolean or animation controls',
							'Reactive destination. Omitted values follow styles or inherited variants.'
						],
						[
							'exit',
							'target or label(s); unset',
							'Outgoing destination. Native conditional motion tags retain their outro; AnimatePresence supplies sequencing and manual coordination.'
						],
						[
							'transition',
							'Transition; automatic property default',
							'Fallback timing; target and per-property transitions override it.'
						],
						[
							'variants',
							'record of target objects/functions',
							'Functions receive custom, current values and current velocities.'
						],
						[
							'custom',
							'unknown; undefined',
							'Data passed to variant resolvers; a presence boundary supplies current exit data.'
						],
						['inherit', 'true', 'false prevents inherited variant labels.'],
						[
							'onAnimationStart / onAnimationComplete',
							'(definition) => void',
							'Called for a started/completed current target or label; interrupted stale completions are suppressed.'
						],
						[
							'onUpdate',
							'(latestValues) => void',
							'Receives current animated values on update frames.'
						]
					]
				},
				related: ['animations', 'transitions', 'animate-presence']
			},
			{
				id: 'gestures',
				title: 'Gesture props and callback contracts',
				text: [
					'Gesture targets accept the same target or variant labels as animate. They compose per property using the documented priority order. Callback props update reactively; queued gesture callbacks use the current callback and are cancelled on teardown.',
					'Tap supports keyboard activation through Enter and supplies focusability for a nonfocusable target. Prefer native buttons for actions so their complete semantics and keyboard behavior remain available. Hover filters emulated touch hover.'
				],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'whileHover / onHoverStart / onHoverEnd',
							'unset',
							'Hover target and callbacks (PointerEvent, { point }).'
						],
						[
							'whileTap / onTapStart / onTap / onTapCancel',
							'unset',
							'Press target and success/cancellation callbacks (PointerEvent, { point }).'
						],
						['whileFocus', 'unset', 'Focus-visible target.'],
						[
							'globalTapTarget / propagate.tap',
							'false / true',
							'Observe release outside the element; optionally prevent parent tap propagation.'
						],
						[
							'onPanSessionStart / onPanStart / onPan / onPanEnd',
							'unset',
							'Callbacks receive (PointerEvent, { point, delta, offset, velocity }); pan starts after movement threshold.'
						],
						[
							'drag and drag* / whileDrag / onDrag*',
							'disabled by default',
							'Axes, constraints, momentum, controls and lifecycle: complete options are in Drag.'
						],
						[
							'whileInView / onViewportEnter / onViewportLeave',
							'unset',
							'Viewport target and callbacks receiving IntersectionObserverEntry.'
						],
						[
							'viewport',
							'{ once:false, amount:"some", margin:"0px" }',
							'root may be an element, ref or getter; amount accepts some/all or a ratio.'
						],
						[
							'disabled',
							'native boolean or null',
							'Also gates component gestures. Compatibility motion.disabled gates gestures without forwarding a native disabled attribute.'
						]
					]
				},
				related: ['gestures', 'drag', 'hover', 'use-in-view']
			},
			{
				id: 'layout-props',
				title: 'Layout props',
				text: [],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'layout',
							'false; true, position, size, preserve-aspect, x or y',
							'Animate measured layout changes; axis modes constrain projection.'
						],
						[
							'layoutId',
							'undefined',
							'Connect separately rendered elements through a shared layout identity.'
						],
						[
							'layoutDependency',
							'undefined',
							'Limit automatic measurement to changes of this value; preserve object identity when unchanged.'
						],
						[
							'layoutScroll / layoutRoot',
							'false / false',
							'Measure a scroll container or fixed-position root in the correct coordinate system.'
						],
						[
							'layoutAnchor',
							'parent top-left behavior',
							'{x,y} normalized anchor used for layout calculations.'
						],
						['layoutCrossfade', 'true', 'Disable shared-element opacity blending with false.'],
						[
							'onBeforeLayoutMeasure / onLayoutMeasure',
							'callbacks',
							'Measurement lifecycle; the latter receives current and previous measured boxes.'
						],
						[
							'onLayoutAnimationStart / onLayoutAnimationComplete',
							'callbacks',
							'Projection animation lifecycle.'
						],
						[
							'layoutGroup / layoutTransition / automatic',
							'legacy controller extensions',
							'Explicit controller, dedicated layout transition and observation policy. New code can use LayoutGroup.'
						]
					]
				},
				related: ['layout', 'layout-group', 'reorder']
			},
			{
				id: 'styles',
				title: 'Style, MotionValues and transforms',
				text: [
					'style accepts a Svelte CSS string or a Motion style object. Object properties can be plain values or MotionValues; transform shorthands such as x, y, rotate and scale compose into a transform. Ordinary style replacement and property deletion remain reactive. Replacing a MotionValue releases its subscription without destroying the external value.',
					'A nonempty raw transform takes precedence over independent transforms, following Motion’s style builder. Removing its animation target returns to its initial or authored base; explicitly reset the raw transform before switching ownership to independent transforms. Use transformTemplate(latestTransforms, generatedTransform) to combine a prefix, suffix or alternate transform order.',
					'Pass children={value} for live MotionValue text without an extra wrapper; ordinary Svelte {value} interpolation does not subscribe to the value. Use useTransform to format it. Native attributes remain native; SVG attribute values can also be MotionValues. Value updates bypass Svelte state rendering while the owning subscription remains lifecycle-managed.'
				],
				related: ['motion-values', 'svg', 'text-animation']
			},
			{
				id: 'custom-components',
				title: 'Create a motion version of your component',
				text: [
					'Call motion.create(Component) outside reactive rendering so the resulting component identity stays stable. The custom component must spread forwarded props, including attachment symbols, onto the actual root element. This forwards native events and installs the animation owner on that root. Its Svelte bindings are preserved.',
					'Motion props are filtered from forwarded native props by default. Set { forwardMotionProps:true } when the custom component intentionally consumes them. motion.create("astra-card") also supports custom native tags. Known SVG tag strings infer their namespace; { namespace:"svg" } disambiguates a custom SVG root.',
					'A custom component cannot inherit a native Svelte transition directive through an opaque component boundary. Use AnimatePresence for managed exits, or forward the native binding contract explicitly when integrating an existing component lifecycle.'
				],
				code: {
					label: 'Custom root component (Card.svelte)',
					source:
						'<script lang="ts">\n  import type { HTMLAttributes } from "svelte/elements";\n  let { children, ...props }: HTMLAttributes<HTMLDivElement> = $props();\n</script>\n<div {...props}>{@render children?.()}</div>'
				},
				related: ['animate-presence', 'lazy-motion']
			},
			{
				id: 'imperative-controls',
				title: 'Animate variants from application code',
				text: [
					'useAnimationControls returns start(definition, transitionOverride?), set(definition), and stop(), with mount and cleanup managed by Svelte. Pass the controls to animate on one or several motion elements. Start them from onMount, an effect, or an event; calls before mounting report an error. start returns a promise for the linked animations.',
					'A start issued from a parent’s onMount waits for child attachment setup in the current microtask. Variant descendants participate in orchestration. Replacing controls unsubscribes the old controls. Legacy controls.set with several labels follows upstream’s first-label-wins order, while declarative target arrays use last-label-wins. Prefer one label for imperative set.'
				],
				code: {
					label: 'Complete imperative variant example',
					source:
						'<script lang="ts">\n  import { motion, useAnimationControls } from \'astra-motion\';\n  const controls = useAnimationControls();\n</script>\n<button onclick={() => controls.start(\'open\')}>Open</button>\n<motion.div animate={controls} initial="closed" variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}>\n  A controlled panel\n</motion.div>'
				},
				related: ['use-animate']
			},
			{
				id: 'native-bindings',
				title: 'Native markup and compatibility',
				text: [
					'Direct animation props are the primary API. The existing motion={{ ... }} object remains supported; defined direct props take precedence over each matching object option. Native value bindings such as bind:value and bind:checked use the compiled tag components. For bind:group, use native inputs with motion.bind so Svelte owns the group in one component. Keep the input type and generic Motion as tag stable while mounted.',
					'For an existing native element, motion.bind(() => options) returns props, transition, animate, stop, update and child. Spread props, which includes the attachment and SSR styles. Alias binding.transition in the script and apply transition:alias|global when an enclosing block can remove the element. Do not attach the same binding twice. Bindings share motion.* defaults and lifecycle, including reducedMotion: never. The createMotion helper has been removed; /state and /state/lite also expose motion.bind, with lite excluding layout and gestures.'
				],
				aliases: ['component-props', 'components', 'api'],
				related: ['getting-started']
			},
			{
				id: 'lifecycle',
				title: 'SSR, accessibility and diagnostics',
				text: [
					'Initial HTML and SVG styles render on the server. Browser animation and gesture listeners start after attachment. Destruction releases the visual owner, scoped subscriptions and pending callbacks; retained presence descendants release after their exit coordination completes.',
					'Use MotionConfig reducedMotion="user" for the application policy. The component default is never, matching Motion. Preserve labels, focus indicators and semantic controls. LazyMotion strict mode reports eager motion usage in development; ignoreStrict downgrades it to a warning when intentionally mixing feature scopes.',
					'A missing animation can be an unsupported CSS value, a higher-priority state, an untransformable inline element or a custom root that did not forward attachments. Keep one motion owner per actual element. See the related topic for the complete gesture, layout or SVG-specific contract.',
					'For custom roots, the installed package includes pnpm exec astra-check-forwarding src/lib/Card.svelte. It flags obvious missing forwarding without mount timers; it cannot prove arbitrary spread dataflow. Development diagnostics explain concrete corrections: remove a conflicting legacy option when a direct prop wins; clear a nonempty raw transform before animating independent x/y/scale; set exit repeat to 0 instead of Infinity; define a missing local variant label when inherit is false. Messages deduplicate per owner and are disabled in production. Unresolved inherited labels can be valid controllers, so no blanket missing-label warning is promised.'
				],
				related: ['accessibility', 'motion-config', 'lazy-motion', 'svg']
			}
		]
	},
	{
		slug: 'motion-config',
		title: '<MotionConfig>',
		group: 'Components',
		summary:
			'Set inherited transition defaults, reduced-motion policy, pointer coordinate correction and style nonces for a component subtree.',
		sections: [
			{
				id: 'usage',
				title: 'Share a policy',
				text: [
					'MotionConfig adds no DOM element. Its children snippet inherits reactive defaults through Svelte context. An inner provider overrides the options it supplies; explicit component props override provider defaults. A target-specific transition is more specific again.',
					'Try changing the reduced-motion policy, then moving the tile. Its position settles immediately under the reduced policy while the opacity transition continues. This makes the preference visible without removing state feedback.'
				],
				example: 'motion-config',
				code: {
					label: 'Small complete provider',
					source:
						'<script lang="ts">\n  import { MotionConfig, motion } from \'astra-motion\';\n</script>\n<MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>\n  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Welcome</motion.div>\n</MotionConfig>'
				}
			},
			{
				id: 'props',
				title: 'Props and defaults',
				text: [],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'children',
							'Snippet; required',
							'Content that receives the configuration; no extra DOM wrapper.'
						],
						[
							'transition',
							'undefined',
							'Fallback Transition; merge behavior follows the qualified engine resolveTransition contract.'
						],
						[
							'reducedMotion',
							'primary component default: never',
							'user follows the device preference; always forces reduction; never opts out. Transforms/layout reduce while paint animation can continue.'
						],
						[
							'transformPagePoint',
							'identity',
							'(point:{x,y}) => {x,y}; applied to drag/pan positions and referenced constraint measurement.'
						],
						[
							'nonce',
							'undefined',
							'CSP nonce for Astra-owned injected style elements such as popped exits and View snapshots.'
						],
						[
							'layoutTransition',
							'undefined; Astra compatibility extension',
							'Dedicated projection fallback before the general transition.'
						],
						[
							'automatic',
							'true for layout controllers',
							'Enable automatic registered layout observation; explicit updateLayout remains available.'
						]
					]
				}
			},
			{
				id: 'internal-static',
				title: 'Static rendering and upstream internal flags',
				text: [
					'MotionConfig.isStatic is an internal upstream implementation flag and is not a supported Astra prop. For a final initial pose, set initial={false}; for accessibility policy, choose reducedMotion="always"; for a static element, omit animation. These choices have distinct behavior and do not claim to emulate the internal flag.'
				]
			},
			{
				id: 'inheritance',
				title: 'Compose and update configuration',
				text: [
					'Providers can be nested. Updating a provider prop changes current descendants, including retained exiting content. Option getters and reactive props keep current callbacks and coordinate transforms available to the integration. An explicit local option supplies an override.',
					'Configuration is scoped to the component tree and each SSR request. No process-wide provider state crosses requests. The OS preference is observed through shared listeners that are released after the final owner is destroyed. Changing reduced policy during active positional or layout animation settles the affected motion.'
				],
				related: ['use-reduced-motion', 'animate-presence']
			},
			{
				id: 'coordinates',
				title: 'Map pointers into the element’s space',
				text: [
					'correctParentTransform(() => parent) returns a transformPagePoint function for a transformed ancestor. It reads the current transform while events are processed. transformViewBoxPoint(() => svg) maps page points into an SVG viewBox using its screen matrix. Native bind:this or motion bind:ref can supply those elements.',
					'Use one mapping for the coordinate system you are correcting. Constraints and pointer positions must use the same mapping. A missing referenced element or a non-invertible transform reports a diagnostic rather than silently moving in the wrong coordinate system.'
				],
				code: {
					label: 'Complete transformed-parent example',
					source:
						'<script lang="ts">\n  import { MotionConfig, motion, correctParentTransform } from \'astra-motion\';\n  let parent = $state<HTMLDivElement>();\n</script>\n<div bind:this={parent} style="transform: scale(0.75)">\n  <MotionConfig transformPagePoint={correctParentTransform(() => parent)}>\n    <motion.button drag dragMomentum={false}>Drag in local space</motion.button>\n  </MotionConfig>\n</div>'
				},
				related: ['drag', 'svg']
			},
			{
				id: 'considerations',
				title: 'CSP, SSR and accessible defaults',
				text: [
					'Supply the same nonce your server authorizes for style elements. The provider propagates it to owned style injection; your application’s own scripts and styles still use your normal CSP setup. Changing a nonce affects subsequent owned style creation.',
					'The server cannot inspect the client’s device preference. Render useful initial content and apply user policy once the browser preference is available. For decorative looping video, text or path effects, use useReducedMotion to select an appropriate alternative and provide a pause control.',
					'motion.* and motion.bind both default to never, matching Motion. Set MotionConfig reducedMotion="user" to follow the device preference, or choose a policy explicitly for each binding.'
				],
				related: ['accessibility', 'getting-started', 'lazy-motion']
			}
		]
	},
	{
		slug: 'lazy-motion',
		title: '<LazyMotion>',
		group: 'Components',
		summary:
			'Render lightweight motion elements immediately and load animation features synchronously or when the interface needs them.',
		sections: [
			{
				id: 'usage',
				title: 'Choose lightweight elements and a feature bundle',
				text: [
					'Import LazyMotion from astra-motion/lazy and the m namespace from astra-motion/m. The lightweight components keep native attributes, events, bindings, refs and initial SSR styles available before the animation runtime loads. Supply domAnimation for state animation and basic gestures, or domMax when the subtree needs pan, drag or projection.',
					'A synchronous bundle is available immediately. An asynchronous features function runs after client mounting and resolves to the bundle object. Return the named bundle, not the whole module namespace. The same DOM nodes survive loading, so native input state and focus are retained.'
				],
				example: 'lazy-motion',
				code: {
					label: 'Complete synchronous example',
					source:
						"<script lang=\"ts\">\n  import { LazyMotion } from 'astra-motion/lazy';\n  import * as m from 'astra-motion/m';\n  import { domAnimation } from 'astra-motion/features/dom-animation';\n</script>\n<LazyMotion features={domAnimation} strict>\n  <m.button whileHover={{ scale: 1.05 }}>A lightweight button</m.button>\n</LazyMotion>"
				},
				related: ['reduce-bundle-size', 'motion']
			},
			{
				id: 'deferred',
				title: 'Load features after the initial render',
				text: [
					'Use a dynamic import in the loader to create a separate production chunk. While the promise is pending, m elements render their original initial pose and native behavior. If targets change during loading, the installed runtime animates from that pose to the latest target.',
					'A loader is not invoked during SSR. Removing a child before features arrive does not create a pending exit registration. A stale or destroyed loader cannot install runtime work. If the feature prop changes, the newest loader generation wins; an existing working bundle can remain active while its replacement loads.'
				],
				code: {
					label: 'Complete deferred example',
					source:
						"<script lang=\"ts\">\n  import { LazyMotion } from 'astra-motion/lazy';\n  import * as m from 'astra-motion/m';\n  const loadFeatures = () => import('astra-motion/features/dom-animation').then(module => module.domAnimation);\n</script>\n<LazyMotion features={loadFeatures} strict>\n  <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Loaded in place</m.div>\n</LazyMotion>"
				}
			},
			{
				id: 'props',
				title: 'Props, features and strict mode',
				text: [],
				table: {
					columns: ['Option or API', 'Default / type', 'Behavior'],
					rows: [
						[
							'features',
							'FeatureBundle or () => Promise<FeatureBundle>; required',
							'Contextual features for descendant m components.'
						],
						[
							'strict',
							'false',
							'Development/browser diagnostic for an eager motion component inside the provider.'
						],
						[
							'children',
							'Snippet; optional',
							'Native content remains usable while the bundle loads.'
						],
						[
							'domAnimation',
							'isolated feature export',
							'Targets, variants, exits, hover, tap, focus and viewport.'
						],
						[
							'domMax',
							'isolated feature export',
							'domAnimation capabilities plus pan, drag and layout/shared layout.'
						],
						[
							'm.create(component, options)',
							'same native custom-root contract as motion.create',
							'Uses the lightweight binding factory and forwarded attachments.'
						],
						[
							'motion ignoreStrict',
							'false',
							'A deliberate eager component warns instead of throwing under strict; production omits the diagnostic.'
						]
					]
				}
			},
			{
				id: 'errors',
				title: 'Recovery, reactive features and composition',
				text: [
					'Failed or malformed feature loads throw through the nearest Svelte boundary. Render a useful failure state there; reset the boundary or supply a new loader identity to retry. The promise rejection is handled so it does not leak a separate unhandled error.',
					'Compatible feature upgrades preserve the existing VisualElement, MotionValues and DOM. When changing domMax to domAnimation, remove props that require drag or layout first; unsupported active props produce a specific missing-feature error. Feature providers are contextual, so a full sibling does not secretly enable layout in a basic scope.',
					'Astra pauses loading and owned animation work inside a hidden AnimateActivity. Eager and deferred descendants can share variant ancestry, but an eager child brings its own feature code into the application graph. Use the isolated entry points consistently when bundle deferral is the objective.'
				],
				related: ['animate-activity', 'animate-presence']
			},
			{
				id: 'verification',
				title: 'Measure the production result',
				text: [
					'Development modules are not a bundle-size measurement. The bundle-size guide records Astra’s actual production imports and separates initial, shared and dynamic chunks. Check the network panel with an empty cache: the feature chunk should be requested only when its loader runs.',
					'Svelte code is shared with the rest of your application, so report it consistently when comparing entry points. Tree shaking depends on your bundler and imports. Importing eager motion or a full bundle elsewhere on the same route can make the intended lazy split disappear.'
				],
				related: ['reduce-bundle-size']
			}
		]
	}
];
