import type { DocPage } from '../doc-types.js';

export const gesturesLayoutPages: DocPage[] = [
	{
		slug: 'gestures',
		title: 'Gestures',
		group: 'Gestures',
		summary:
			'Add feedback for hover, press, focus, dragging, and visibility while keeping native controls.',
		sections: [
			{
				id: 'feedback',
				title: 'Start with a native button',
				text: [
					'Gesture props temporarily change an animation target. When the gesture ends, the element returns to the values supplied by animate. You can use target objects, variant names, or arrays of variant names.',
					'Use motion.button when the action is a button. Native onclick, disabled, form behavior, focus, and keyboard activation still belong to the element. onTap reports the press gesture; it does not replace a native click.'
				],
				example: 'gesture-feedback',
				code: {
					label: 'Focused excerpt — native button feedback',
					source: `<script lang="ts">
  import { motion } from 'astra-motion';
</script>

<motion.button
  onclick={save}
  whileHover={{ y: -3 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ scale: 1.04 }}
>
  Save
</motion.button>`
				}
			},
			{
				id: 'choose-a-gesture',
				title: 'Choose the feedback that fits',
				text: [
					'A gesture target is optional: you can subscribe to its callbacks without animating anything. Pan reports pointer movement without moving the element; drag additionally writes its x and y MotionValues.'
				],
				table: {
					columns: ['Capability', 'Animation prop', 'When it is active'],
					rows: [
						[
							'Hover',
							'whileHover',
							'A non-touch pointer is over the element; touch-generated hover is filtered.'
						],
						[
							'Press',
							'whileTap',
							'The primary pointer is pressed, or the focused element is using Enter.'
						],
						[
							'Focus',
							'whileFocus',
							'The browser considers focus visible, usually after keyboard interaction.'
						],
						[
							'Drag',
							'whileDrag',
							'A drag has crossed its recognition threshold and acquired its axis lock.'
						],
						['Viewport', 'whileInView', 'The element intersects the configured viewport.'],
						[
							'Pan',
							'No animation prop',
							'A pointer session crosses 3 CSS pixels; use callbacks to drive your own interaction.'
						]
					]
				},
				related: ['drag', 'hover', 'scroll', 'use-in-view']
			},
			{
				id: 'composition',
				title: 'Combine gestures and variants',
				text: [
					'A parent gesture can select a named variant on its descendants. Give each child a variant with that name to coordinate different properties. Gesture states compose property by property: dragging has priority over tap, hover, focus, viewport, and animate. Exit has the highest priority; initial only establishes the starting pose.',
					'A tap is cancelled when its draggable ancestor takes over the pointer. For nested tap targets, propagate={{ tap: false }} stops the child gesture from activating ancestor tap handlers without stopping ordinary DOM pointer events. Native capture handlers can also stop an event before it reaches a parent.'
				],
				code: {
					label: 'Focused excerpt — inherited hover variant',
					source: `<motion.button whileHover="active" whileFocus="active">
  <motion.span variants={{ active: { rotate: 12 } }}>
    Open collection
  </motion.span>
</motion.button>`
				},
				related: ['motion', 'animate-presence']
			},
			{
				id: 'callbacks',
				title: 'Read gesture events',
				text: [
					'Hover and tap callbacks receive (event, { point }), where point contains page x and y. Pan and drag receive (event, info), with point, delta since the previous update, offset since the session began, and velocity in units per second. Coordinates are CSS pixels unless MotionConfig supplies transformPagePoint.',
					'Pan and drag updates run with the animation frame. Hover, tap, pan-end, and drag-end callbacks run after rendering; do not expect their side effects immediately inside the native pointer handler. Handlers use current options. Unmounting cancels queued callbacks and active sessions.'
				],
				table: {
					columns: ['Callbacks', 'Contract'],
					rows: [
						[
							'onHoverStart / onHoverEnd',
							'A filtered hover begins or ends. Leaving during a press defers the end until release.'
						],
						[
							'onTapStart / onTap / onTapCancel',
							'Press begins; release succeeds inside the target; or release/cancellation fails. Keyboard presses report PointerEvents too.'
						],
						[
							'onPanSessionStart / onPanStart / onPan / onPanEnd',
							'Pointerdown; threshold crossed; frame updates; recognized session ended.'
						],
						[
							'onViewportEnter / onViewportLeave',
							'Receive the IntersectionObserverEntry when the configured visibility state changes.'
						],
						[
							'globalTapTarget',
							'False by default. True listens for presses anywhere in the window and accepts their release.'
						],
						[
							'disabled',
							'Suppresses gesture work. Native disabled controls, inert ancestors, and aria-disabled="true" also suppress Astra gestures.'
						]
					]
				}
			},
			{
				id: 'accessibility-and-lifecycle',
				title: 'Keep the interaction usable',
				text: [
					'Always provide a visible focus indicator. A nonfocusable tap target receives tabindex=0, but that does not give it button semantics; prefer a button or link. Enter activates the tap lifecycle. Astra also shows whileTap feedback for Space while leaving click semantics to the native control.',
					'Hover should reveal an enhancement, not the only route to an action. Provide keyboard alternatives for dragging and reordering. Respect reduced-motion preferences through MotionConfig and keep feedback understandable when transforms are removed.',
					'Gesture listeners attach only in the browser. Server rendering outputs the element and its initial styles. Removal, disabled updates, pointer cancellation, and window blur release active state and listeners. Put touch-action on drag handles before the gesture starts so the browser can arbitrate scrolling.'
				],
				related: ['accessibility', 'motion-config', 'use-drag-controls']
			},
			{
				id: 'troubleshooting',
				title: 'Troubleshooting',
				points: [
					'A touch interaction should not leave a hover state behind; use whileTap for touch feedback.',
					'If a gesture seems ignored, check disabled or inert ancestors, an active parent drag, and competing gesture targets.',
					'For SVG, attach the gesture to a rendered element such as a path or group with pointer events. Filters and other nonrendered SVG definitions do not receive pointer events.',
					'Use viewport.root as an element, { current } ref, or getter. Viewport defaults are once=false, margin="0px", and amount="some"; amount can also be "all" or a number from 0 to 1.'
				],
				text: [
					'The motion reference lists the complete element API. The drag and hover guides below cover their specific techniques.'
				],
				related: ['motion', 'drag', 'hover', 'svg']
			}
		]
	},
	{
		slug: 'drag',
		title: 'Drag',
		group: 'Gestures',
		summary:
			'Move elements with the pointer, bound their movement, and control what happens on release.',
		sections: [
			{
				id: 'start',
				title: 'Make an element draggable',
				text: [
					'Add drag to a motion element to move both axes, or drag="x" / drag="y" to restrict movement. Drag writes the same x and y MotionValues that style and animation use, so direct manipulation and animated release share one transform.',
					'The primary pointer must move at least 3 CSS pixels to start. Pointerdown on an editable descendant does not start the parent drag. Buttons and links can be used as handles; useDragControls makes that relationship explicit.'
				],
				code: {
					label: 'Smallest example',
					source: `<script lang="ts">
  import { motion } from 'astra-motion';
</script>

<motion.div drag="x" style="width:64px;height:64px;background:currentColor;touch-action:pan-y;" />`
				},
				related: ['use-drag-controls']
			},
			{
				id: 'constraints',
				title: 'Choose bounds and elasticity',
				text: [
					'Numeric dragConstraints are translation offsets from the element’s layout position: { left: -100, right: 100, top: 0, bottom: 200 }. Omitted edges are unbounded. Values must be finite and each minimum must be no greater than its maximum.',
					'For a responsive container, bind its element and pass dragConstraints={() => bounds}. An element or { current: element } ref is accepted too. Bounds are measured at drag start and during layout/size updates. Resizing a constrained container preserves the element’s relative position within the new bounds.',
					'Elasticity allows resistance outside a bound. Astra follows Motion 13.4.4’s shipped default of 0.35; the upstream component article still describes 0.5. False gives hard bounds, true means 0.35, a number applies to every edge, and an edge object configures each edge separately. Unspecified edges in that object use zero elasticity.'
				],
				example: 'drag-playground',
				code: {
					label: 'Focused excerpt — reactive container bounds',
					source: `<script lang="ts">
  import { motion } from 'astra-motion';
  let bounds = $state<HTMLDivElement>();
</script>

<div bind:this={bounds}>
  <motion.div drag dragConstraints={() => bounds} dragElastic={0.2} />
</div>`
				}
			},
			{
				id: 'release',
				title: 'Shape the release',
				text: [
					'Momentum continues movement with an inertia animation after release. Set dragMomentum={false} to discard release velocity; elastic overshoot still returns to the bounds. dragSnapToOrigin returns to zero, and can be true, "x", or "y".',
					'dragTransition customizes inertia. Its modifyTarget function receives the calculated destination and returns a replacement, useful for snapping to a grid. Numeric bounds still apply. With hard bounds, Astra clamps the release destination to prevent the upstream generator’s first-frame overshoot.'
				],
				table: {
					columns: ['Option', 'Default', 'Effect'],
					rows: [
						['dragMomentum', 'true', 'Carry pointer velocity into release.'],
						['dragSnapToOrigin', 'false', 'Return one or both dragged axes to zero.'],
						['dragTransition.power', '0.8', 'Scale the projected destination from velocity.'],
						['dragTransition.timeConstant', '750 ms', 'Set the rate of velocity decay.'],
						[
							'dragTransition.bounceStiffness / bounceDamping',
							'200 / 40 with elasticity',
							'Control the spring that returns into bounds. Hard bounds use an overdamped return.'
						],
						[
							'dragTransition.restDelta / restSpeed',
							'1 / 10',
							'Position and velocity thresholds for settling.'
						],
						[
							'dragTransition.modifyTarget',
							'undefined',
							'Return a snapped destination before the release animation begins.'
						]
					]
				},
				related: ['transitions']
			},
			{
				id: 'direction-and-composition',
				title: 'Coordinate axes and nested gestures',
				text: [
					'dragDirectionLock waits until movement exceeds 10 pixels on an axis, then calls onDirectionLock("x" | "y") once and keeps the other axis fixed. When both axes cross together, y wins. This is separate from the 3-pixel start threshold; changing useDragControls’ distanceThreshold does not change the direction-lock threshold.',
					'Nested drags arbitrate through shared axis locks. dragPropagation={true} allows ancestor drags to participate rather than claiming an exclusive lock. A recognized drag cancels nested tap feedback. whileDrag controls additional properties such as scale or opacity while the session is active.'
				],
				table: {
					columns: ['Option', 'Default', 'Use'],
					rows: [
						['drag', 'false', 'true, "x", or "y" enables movement.'],
						['dragDirectionLock', 'false', 'Choose one axis from the initial gesture direction.'],
						['dragPropagation', 'false', 'Allow parent/child drag propagation.'],
						[
							'dragListener',
							'true',
							'False allows only a controls.start() handle to begin dragging.'
						],
						[
							'dragControls',
							'undefined',
							'A useDragControls() controller, shared with an external handle.'
						],
						[
							'onMeasureDragConstraints',
							'undefined',
							'Receive { top, left, right, bottom }; return replacement bounds or nothing.'
						]
					]
				}
			},
			{
				id: 'events-and-coordinates',
				title: 'Observe the gesture',
				text: [
					'onDragStart, onDrag, and onDragEnd receive (event, info). info contains point, delta, offset, and velocity. onDrag sees the updated rendered pose. onDragEnd runs after rendering when the pointer session has ended; onDragTransitionEnd() runs when all release animations settle.',
					'Page coordinates are corrected through MotionConfig transformPagePoint. correctParentTransform(() => parent) converts page points into a transformed HTML parent’s local plane, composing ancestor transforms, perspective, and transform origins; transformViewBoxPoint(() => svg) maps page points into SVG viewBox coordinates, including its origin and preserveAspectRatio. Pass the helper through configuration for the affected subtree.',
					'Astra compensates scrolling and layout movement while dragging, including a stationary pointer. Keep layout-enabled Reorder items keyed by stable values so insertion and removal can preserve the dragged element’s position.'
				],
				code: {
					label: 'Focused excerpt — coordinate correction',
					source: `<script lang="ts">
  import { MotionConfig, motion, correctParentTransform } from 'astra-motion';
  const transformPoint = correctParentTransform(() => parent);
</script>

<MotionConfig transformPagePoint={transformPoint}>
  <motion.div drag />
</MotionConfig>`
				},
				related: ['motion-config', 'svg', 'reorder']
			},
			{
				id: 'lifecycle',
				title: 'Cancellation, accessibility, and troubleshooting',
				text: [
					'On motion elements, native pointercancel follows a normal release from the last pointer position, including configured inertia and onDragEnd. Motion components track their pointer through the window, so moving a keyed element does not interrupt dragging when native capture is lost. Explicit controls.cancel(), window blur, disablement, and removal cancel without starting inertia. controls.cancel() also omits onDragEnd; controls.stop() follows normal release.',
					'Reduced-motion policy suppresses animated transforms and layout, but motion elements retain direct dragging and release inertia, matching Motion. Set dragMomentum={false} when your interaction should discard release velocity. Existing createMotion bindings retain their earlier behavior: native cancellation and reduced-motion policy suppress inertia, and lost pointer capture cancels their captured session. Keep a button, range input, or other keyboard route to the same result; dragging itself does not implement keyboard movement.',
					'No DOM measurement runs during SSR. Getter constraints may initially return undefined, but must resolve to a mounted element when a drag starts. Use touch-action: none for free dragging, pan-y for horizontal dragging, and pan-x for vertical dragging; set the same policy on external handles. Avoid a separate CSS transform or animation competing for the dragged element’s transform.'
				],
				points: [
					'If the element jumps under a scaled parent, configure transformPagePoint and ensure the intended parent getter resolves.',
					'To keep dragged content selectable, set user-select:text and -webkit-user-select:text inline. WebKit computes a stylesheet-only text policy like its default, so that form does not override the automatic drag selection policy.',
					'If bounds seem wrong, check container padding, transformed geometry, and whether a numeric bound is an offset rather than an absolute page coordinate.',
					'Replacing x or y with a nonnumeric CSS length is unsupported during drag; numeric values and percentage origins are supported.',
					'Use Reorder for list ordering; drag alone only moves the element visually.'
				],
				related: ['accessibility', 'reorder', 'use-drag-controls']
			}
		]
	},
	{
		slug: 'hover',
		title: 'Hover',
		group: 'Gestures',
		summary:
			'Create pointer feedback that avoids sticky touch hover and offers an equivalent focus treatment.',
		sections: [
			{
				id: 'basics',
				title: 'Animate while the pointer is over an element',
				text: [
					'whileHover sets a temporary target. The element animates back to its current animate values when hover ends, including values that changed while it was hovered. Unlike a CSS :hover rule, the recognizer filters touch-generated pointer hover.',
					'Supply a target object for one element, or a variant label to coordinate descendants. Native attributes and event handlers remain available.'
				],
				code: {
					label: 'Smallest example',
					source: `<script lang="ts">
  import { motion } from 'astra-motion';
</script>

<motion.button whileHover={{ y: -4 }} whileFocus={{ y: -4 }}>
  Open collection
</motion.button>`
				}
			},
			{
				id: 'variants',
				title: 'Coordinate the details of a card',
				text: [
					'A hover label is inherited by motion descendants that define that variant. A child can rotate while the parent lifts. Reuse the label for whileFocus to expose the same visual cue to keyboard users.',
					'Keep the main action available without hover. Touch users should be able to press the control directly; keyboard users should see a focus outline as well as the animation.'
				],
				example: 'hover-feedback',
				related: ['gestures', 'accessibility']
			},
			{
				id: 'callbacks',
				title: 'Handle hover start and end',
				text: [
					'onHoverStart(event, { point }) and onHoverEnd(event, { point }) receive a PointerEvent and page coordinates. They run after the frame’s render phase. The motion element owns attachment, live callbacks, and teardown.',
					'If the pointer leaves while pressed, hover end waits until release or cancellation. A global active drag suppresses hover recognition. These rules prevent a pressed or dragged control from flickering through hover states.'
				],
				table: {
					columns: ['Prop', 'Default', 'Contract'],
					rows: [
						['whileHover', 'undefined', 'Target, variant name, or array of variant names.'],
						[
							'onHoverStart',
							'undefined',
							'(PointerEvent, { point: { x, y } }) when hover is recognized.'
						],
						['onHoverEnd', 'undefined', 'Same arguments when the hover ends.'],
						[
							'transition',
							'Motion default',
							'Controls entering and returning from hover; a target may supply its own transition.'
						]
					]
				},
				code: {
					label: 'Focused excerpt — hover callbacks',
					source: `<motion.button
  onHoverStart={(event, info) => report('start', info.point)}
  onHoverEnd={(event, info) => report('end', info.point)}
>
  Preview
</motion.button>`
				}
			},
			{
				id: 'native-helper',
				title: 'Use the lightweight hover recognizer',
				text: [
					'hover(target, onStart, options?) attaches the same touch-filtered recognizer to ordinary DOM elements without a motion component. The target can be an element, element array, NodeList, or CSS selector. A selector resolves the matching elements when the helper is called; it does not track future matches.',
					'onStart(element, event) may return onEnd(event). The helper returns a cleanup function. In Svelte, return that cleanup from an attachment so removing the element also removes its listeners. Unlike motion callbacks, these recognizer callbacks run directly with the pointer event.'
				],
				code: {
					label: 'Complete native-element example',
					source: `<script lang="ts">
  import { hover } from 'astra-motion';
  let active = $state(false);
  function trackHover(element: HTMLElement) {
    return hover(element, () => {
      active = true;
      return () => { active = false; };
    });
  }
</script>

<button {@attach trackHover}>{active ? 'Pointer over button' : 'Hover here'}</button>`
				},
				table: {
					columns: ['Option', 'Default', 'Use'],
					rows: [
						['passive', 'true', 'Set false if the listener must call preventDefault.'],
						['once', 'false', 'Use a listener only once.']
					]
				},
				points: [
					'Call the helper after the DOM exists, normally from a Svelte attachment or onMount; selector lookup is not an SSR operation.',
					'Always retain the returned cleanup when attaching imperatively. The attachment form owns that lifecycle automatically.',
					'The helper supplies recognition only; use motion components when you want gesture priority, variants, and animated return targets.'
				]
			},
			{
				id: 'lifecycle',
				title: 'Reactivity, SSR, and cleanup',
				text: [
					'Reactive target and callback changes are read by the current motion binding. Removing the element detaches the recognizer and cancels pending callbacks. SSR outputs the initial/animate pose; hover starts only after the browser mounts the element.',
					'Use whileTap for press feedback and whileFocus for focus-visible feedback. If a visual state is required on touch, store it explicitly in application state instead of relying on hover.'
				],
				related: ['motion', 'gestures']
			},
			{
				id: 'troubleshooting',
				title: 'Troubleshooting',
				text: [
					'Check pointer-events, disabled or inert ancestors, and whether a drag is currently active if hover appears absent. An SVG definition such as a filter cannot receive hover; place the gesture on the rendered shape or its group.',
					'Avoid continuously animating a large transform just to indicate hover. A small lift, color change, or opacity change usually supplies enough feedback, and reduced-motion policy can remove the spatial part.'
				],
				related: ['motion-config', 'svg']
			}
		]
	},
	{
		slug: 'use-drag-controls',
		title: 'useDragControls',
		group: 'Hooks',
		summary:
			'Start, stop, or cancel an element’s drag from a separate handle or application event.',
		sections: [
			{
				id: 'handle',
				title: 'Connect a handle to a draggable element',
				text: [
					'Create one stable controller for an interaction and pass it to the draggable element’s dragControls prop. Call controls.start(event) from a native onpointerdown handler. Set dragListener={false} if the element should only respond to the handle.',
					'useDragControls is an ordinary SSR-safe factory, not a React-style hook. Create it once in the component script; the motion element subscribes when mounted and unsubscribes when removed.'
				],
				example: 'drag-controls-handle',
				code: {
					label: 'Smallest handle example',
					source: `<script lang="ts">
  import { motion, useDragControls } from 'astra-motion';
  const controls = useDragControls();
</script>

<button type="button" onpointerdown={(event) => controls.start(event)} style="touch-action:none;">
  Drag handle
</button>
<motion.div
  drag="x"
  dragControls={controls}
  dragListener={false}
  style="width:64px;height:64px;background:currentColor;"
/>`
				}
			},
			{
				id: 'api',
				title: 'Arguments and returned controls',
				text: [
					'The factory accepts no arguments. Its controller can address several subscribed elements, although a single controlled element is the common case. start returns void; stop and cancel return void and are safe when no drag is active.'
				],
				table: {
					columns: ['Member or option', 'Default', 'Contract'],
					rows: [
						[
							'start(event, options?)',
							'—',
							'Starts from a primary PointerEvent. The receiving motion element must have drag enabled.'
						],
						[
							'options.snapToCursor',
							'false',
							'Moves the center of each enabled drag axis to the pointer before dragging. Uses live element geometry.'
						],
						[
							'options.distanceThreshold',
							'3',
							'Minimum pointer movement in CSS pixels before recognizing the session. Must be finite and nonnegative.'
						],
						[
							'stop()',
							'—',
							'Ends the session normally: onDragEnd runs and release animation can start.'
						],
						[
							'cancel()',
							'—',
							'Ends the session and owned release animation without onDragEnd or new momentum.'
						]
					]
				}
			},
			{
				id: 'snapping',
				title: 'Snap to a track or wait for deliberate movement',
				text: [
					'Use snapToCursor for a track that should place its thumb under the click. Constraint checks, coordinate transforms, and the configured drag axis still apply. A larger distanceThreshold is useful when a pointer press should not immediately become a drag.',
					'Direction locking has its own upstream threshold: it selects an axis after more than 10 pixels, even if start uses a different recognition threshold. start does not bypass drag constraints, disabled state, or global axis arbitration.'
				],
				code: {
					label: 'Focused excerpt — immediate track positioning',
					source: `function begin(event: PointerEvent) {
  controls.start(event, { snapToCursor: true, distanceThreshold: 0 });
}`
				},
				related: ['drag', 'motion-config']
			},
			{
				id: 'lifecycle',
				title: 'Lifecycle and accessibility',
				text: [
					'Controllers keep no independent frame loop. Sessions, window listeners, and inertia belong to the attached motion element. Replacing a controller prop moves that element’s subscription to the new controller; removal cancels its session.',
					'Calling start before a receiver mounts is a no-op. A mounted receiver with unresolved element constraints reports a useful error rather than measuring a missing element. There is no document access during server construction.',
					'Set touch-action on the actual handle before the pointerdown. A drag handle does not supply keyboard movement: pair it with a native range input or move buttons. For cancellation through Escape, call controls.cancel() from the focused handle’s keyboard handler.'
				],
				points: [
					'If direct presses still start dragging, add dragListener={false}.',
					'If the handle does nothing, check that the target has drag enabled and both elements share the same controller instance.',
					'Use the native PointerEvent; constructing an unrelated mouse event loses the pointer identity needed for a reliable session.'
				],
				related: ['reorder', 'accessibility']
			}
		]
	},
	{
		slug: 'reorder',
		title: 'Reorder',
		group: 'Components',
		summary:
			'Build controlled sortable lists and wrapped grids with shared drag and layout behavior.',
		sections: [
			{
				id: 'list',
				title: 'Render the controlled order',
				text: [
					'Reorder.Group receives the current values and calls onReorder with a new array. Apply that array to your state and render a keyed each block with one Reorder.Item for each value. Values must be unique and keep their identity; objects work when their references remain stable.',
					'Items measure their layout, move with their drag MotionValues, and animate into their final position. The group infers horizontal, vertical, or wrapped two-dimensional ordering from the measured boxes.'
				],
				example: 'reorder-list-grid',
				code: {
					label: 'Smallest controlled list',
					source: `<script lang="ts">
  import { Reorder } from 'astra-motion';
  let items = $state(['Research', 'Sketch', 'Review']);
</script>

<Reorder.Group values={items} onReorder={(next) => items = next}>
  {#each items as item (item)}
    <Reorder.Item value={item} style="position:relative;">{item}</Reorder.Item>
  {/each}
</Reorder.Group>`
				}
			},
			{
				id: 'group-api',
				title: 'Reorder.Group props',
				text: [
					'The group renders a native ul by default. Change as when another element fits the content and forward ordinary attributes, events, style, and motion props. It does not mutate values; onReorder must commit an accepted order. Unmeasured values retain their slots until measurement is available.'
				],
				table: {
					columns: ['Prop', 'Default', 'Contract'],
					rows: [
						['values', 'Required', 'Array of unique values rendered by the items.'],
						[
							'onReorder',
							'Required',
							'(nextValues: T[]) => void. Commit the requested order to application state.'
						],
						[
							'axis',
							'Automatic',
							'"x", "y", or "xy". Empty or not-yet-measured groups begin with y.'
						],
						['as', '"ul"', 'Native HTML element tag. Choose semantics appropriate to the content.'],
						['children', 'undefined', 'Svelte snippet containing the keyed items.'],
						['bind:ref', 'undefined', 'Access the group’s native element.']
					]
				}
			},
			{
				id: 'item-api',
				title: 'Reorder.Item props',
				text: [
					'Reorder.Item must be inside a Reorder.Group. It renders a native li by default and accepts ordinary motion props, including transitions, variants, callbacks, and MotionValues. Keep a positioned style such as position:relative so its automatic z-index can lift it above its siblings.',
					'The item returns to its layout origin after release. onDrag runs after internal ordering and scrolling work; onLayoutMeasure also receives the measured box. Borrowed style.x and style.y MotionValues remain caller-owned.'
				],
				table: {
					columns: ['Prop or behavior', 'Default', 'Contract'],
					rows: [
						['value', 'Required', 'The identical value present in the group values array.'],
						['as', '"li"', 'Native HTML tag.'],
						['layout', 'true', 'Animate layout changes; "position" avoids size animation.'],
						[
							'drag',
							'Group axis',
							'Derived from automatic or explicit group axes; can be overridden with ordinary drag props.'
						],
						[
							'dragSnapToOrigin',
							'Enabled by Reorder',
							'Return the dragged item to its new layout position.'
						],
						[
							'style.x / style.y',
							'Internal MotionValues',
							'Provide MotionValues to observe or share the item’s drag position.'
						],
						[
							'zIndex',
							'1 while displaced; unset at origin',
							'Provide position:relative, absolute, fixed, or sticky for stacking.'
						],
						[
							'children / bind:ref',
							'undefined',
							'A Svelte snippet and access to the native item element.'
						]
					]
				},
				related: ['motion', 'motion-values']
			},
			{
				id: 'handles-grids-scroll',
				title: 'Add handles, grids, and scrolling',
				text: [
					'Use dragListener={false} and a stable useDragControls() controller for a dedicated handle. The demonstration also supplies Earlier/Later buttons so pointer dragging is an enhancement rather than the only way to reorder.',
					'Automatic axes follow responsive layout changes, including a vertical list becoming a wrapped grid during a drag. One-dimensional lists swap when movement crosses a neighbor’s center in the current direction. Wrapped layouts use row and box geometry, including right-to-left rows.',
					'When switching between list and grid changes an item’s width, put its text and controls inside a motion element with layout="position". The item can still animate its full size while the inner boundary corrects inherited scale. Set borderRadius through the item’s style prop for corner correction.',
					'The vertically scrolling example clips horizontal overflow on the inner group with overflow-x:clip. Projected items can otherwise create a temporary horizontal scroll range even when their visible boxes fit. The group keeps overflow-y:visible, so the outer container still owns vertical scrolling and drag-edge scrolling.',
					'Dragging toward an edge scrolls the nearest scrollable container or the document. Scrolling continues while the pointer rests near that edge and stops on release, cancellation, or removal. The group disables scroll anchoring to avoid the browser fighting reordering. Current Motion references do not define autoScroll, edgeThreshold, maxSpeed, or deadzone props; Astra exposes no invented equivalents.'
				],
				related: ['use-drag-controls', 'layout', 'accessibility']
			},
			{
				id: 'composition',
				title: 'Insertion, removal, and presence',
				text: [
					'Stable each-block keys preserve item instances as the controlled order changes. Astra adjusts the active drag when siblings are inserted or removed, so the item stays under the pointer. Removing the dragged item releases its lock, window listeners, scrolling work, and subscriptions.',
					'A focused control stays focused when its keyed item moves and the control remains focusable. Astra restores focus after the DOM update if moving the node blurred it, while respecting focus intentionally moved elsewhere. Removing a focused item still requires the application to choose an appropriate next focus target.',
					'Use AnimatePresence to retain an outgoing item for its exit, and LayoutGroup when shared IDs should be namespaced or measurements coordinated with other components. Keep the retained Reorder.Item under its group; an exit should not create a second independent transform owner.'
				],
				related: ['animate-presence', 'layout-group']
			},
			{
				id: 'lifecycle',
				title: 'SSR and troubleshooting',
				text: [
					'Server output follows the supplied order and native tags. Measurement and dragging begin in the browser; the first measurements resolve automatic axes. The group and items dispose their registrations when removed.',
					'A list that springs back to its old order usually has an onReorder callback that did not update values. Missing measurements often indicate a display:none item, a value absent from values, or an Item outside its Group. Duplicate values are rejected.'
				],
				points: [
					'Avoid CSS transforms that independently own the item transform; put animated properties in its motion style.',
					'For a right-to-left row, set axis="xy" explicitly. Motion 13.4.4 applies RTL insertion only to its two-dimensional algorithm; automatic single-axis x ordering retains that upstream limitation.',
					'Keep drag handle touch-action:none, including when the list itself scrolls.',
					'For large or virtualized collections, ensure every potential neighbor needed for the current interaction is mounted and measured; offscreen virtualization is not supplied by Reorder.',
					'Provide keyboard move controls and announce the resulting order when that information is important.'
				],
				related: ['drag', 'motion-config']
			}
		]
	},
	{
		slug: 'layout',
		title: 'Layout animation',
		group: 'Animations',
		summary:
			'Animate the size and position changes your layout already makes, including shared elements.',
		sections: [
			{
				id: 'automatic',
				title: 'Change the layout and let Astra connect it',
				text: [
					'Add layout to a motion element, then change its classes, CSS, content, or surrounding layout through ordinary Svelte state. Astra measures the old and new boxes and animates the difference with transforms. You do not need to calculate a pixel animation for each layout rule.',
					'Put the final width, height, alignment, or other layout property in normal style or CSS. Use animate for values that should be tweened directly. layout="position" on an inner element helps its content retain its proportions as the parent resizes.',
					'The expandable note captures the card and paragraph through their public DOM refs on close. It holds the card’s currently painted size and preserves the text column’s width and the paragraph’s position, wrapping and inherited scale while AnimatePresence fades it. onExitComplete releases the held geometry, so removal and collapse happen together after the text is invisible. This also stops an interrupted expansion from continuing to grow or rewrapping the fading text. Reopening clears the held geometry and reverses the exit.',
					'When the same update narrows a parent and starts a popLayout exit, the outgoing text can already have rewrapped before its box is captured. Sequence the fade before resizing when text must retain its readable width; popLayout alone does not guarantee a stable exit box under a simultaneously resizing ancestor.'
				],
				example: 'layout-expand',
				code: {
					label: 'Focused excerpt — state changes real CSS',
					source: `<motion.div layout style={{ width: expanded ? 320 : 180 }}>
  <motion.div layout="position">Content</motion.div>
</motion.div>`
				}
			},
			{
				id: 'modes-and-transitions',
				title: 'Choose what changes',
				text: [
					'layout=true animates size and position. String modes restrict the calculation. Motion components use the qualified upstream default layout transition: 0.45 seconds with easing [0.4, 0, 0.1, 1]. Set transition.layout when opacity or other values need a separate transition.',
					'Existing createLayout controllers remain supported and retain their historical spring default when no transition is supplied. Set a transition explicitly when migrating between authoring styles and exact timing matters.'
				],
				table: {
					columns: ['Layout mode', 'Behavior'],
					rows: [
						['true', 'Animate both size and position.'],
						['"position"', 'Animate position while using the destination size.'],
						['"size"', 'Animate size while using the destination position.'],
						[
							'"preserve-aspect"',
							'Avoid stretching when the aspect ratio changes substantially. Fractional measured dimensions are retained so WebKit edge rounding does not distort the ratio.'
						],
						['"x" / "y"', 'Project changes on the selected axis.']
					]
				},
				code: {
					label: 'Focused excerpt — separate layout transition',
					source: `<motion.div
  layout
  animate={{ opacity: open ? 1 : 0.6 }}
  transition={{ opacity: { duration: 0.15 }, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
/>`
				},
				related: ['transitions']
			},
			{
				id: 'shared-elements',
				title: 'Connect two elements with a shared identity',
				text: [
					'Give related elements the same layoutId to animate between their measured positions and sizes. layoutId activates shared projection even without layout. When both elements remain mounted they crossfade by default; layoutCrossfade={false} disables that opacity mixing.',
					'The incoming destination supplies the shared layout transition. Use LayoutGroup id to namespace repeated controls so a selection in one instance does not connect to a different instance. Retain outgoing content with AnimatePresence when it needs an exit before removal.'
				],
				code: {
					label: 'Focused excerpt — moving selection',
					source: `<LayoutGroup id="navigation">
  {#each tabs as tab (tab.id)}
    <button onclick={() => selected = tab.id}>
      {#if selected === tab.id}
        <motion.div layoutId="highlight" />
      {/if}
      {tab.label}
    </button>
  {/each}
</LayoutGroup>`
				},
				related: ['layout-group', 'animate-presence']
			},
			{
				id: 'curved-paths',
				title: 'Follow a curved path',
				text: [
					'Pass arc() to transition.layout.path to bend a layout move. Keep one path instance in the component script so interrupted and reversed animations retain a consistent bend. Duration, easing, or spring settings still control progress along the path.',
					'The same option works for shared layoutId transitions. rotate adds a path rotation to your authored rotate and returns that contribution to zero at the endpoints. Layout shifts shorter than 20 CSS pixels use straight projection to avoid small wobbles.'
				],
				example: 'layout-curved-path',
				code: {
					label: 'Focused excerpt — retain the path instance',
					source: `<script lang="ts">
  import { arc, motion } from 'astra-motion';
  const path = arc({ strength: 0.7, rotate: 0.3 });
</script>

<motion.div layout transition={{ layout: { duration: 0.8, path } }} />`
				},
				table: {
					columns: ['arc option', 'Default', 'Qualified behavior'],
					rows: [
						[
							'strength',
							'0.5',
							'Sets the quadratic control-point distance relative to travel distance; 0 produces a straight path.'
						],
						[
							'peak',
							'0.5',
							'Places the control point along the travel vector; use values from 0 to 1.'
						],
						[
							'direction',
							'Automatic',
							'Keeps a stable screen-space bend. "cw" and "ccw" choose a side relative to travel.'
						],
						[
							'rotate',
							'false',
							'true adds full path rotation; a number from 0 to 1 scales that contribution.'
						]
					]
				},
				points: [
					'The current upstream article overstates bend height: the shipped quadratic implementation reaches half strength × travel distance at its symmetric midpoint. Astra uses and verifies that engine behavior.',
					'For direct x/y animations, place path in transition.path instead. The full animate and useAnimate APIs support it; mini animation does not.',
					'Reduced-motion policy removes spatial layout animation, including its arc.'
				],
				related: ['transitions', 'use-animate', 'motion-config']
			},
			{
				id: 'measurement',
				title: 'Control measurement and coordinate contexts',
				text: [
					'layoutDependency reduces measurement work when you know which state can change a box. Measurements are skipped while that value is unchanged, except where drag or presence needs fresh geometry. Use a primitive revision or a stable object whose reference changes when relevant layout changes.',
					'Mark scroll containers with layoutScroll and fixed-position roots with layoutRoot. These flags can be supplied without animated layout. Astra also preserves 2D transformed ancestors outside the motion hierarchy and sticky boundaries inside nested scrolling or clipping containers.',
					'layoutAnchor changes the point used for a child’s relative projection. Supply { x, y } with progress values between 0 and 1; the default is the top-left. False disables relative projection. This helps when nested layout animations use different timing.'
				],
				table: {
					columns: ['Prop', 'Default', 'Purpose'],
					rows: [
						[
							'layoutDependency',
							'undefined',
							'Measure automatically; otherwise gate updates by identity changes, with drag/presence exceptions.'
						],
						['layoutScroll', 'false', 'Include the scroll offset of this coordinate context.'],
						['layoutRoot', 'false', 'Treat a fixed container as a coordinate root.'],
						[
							'layoutAnchor',
							'{ x: 0, y: 0 }',
							'Choose a relative anchor, or false to disable relative projection.'
						],
						['layoutCrossfade', 'true', 'Allow shared elements to mix opacity.'],
						[
							'onBeforeLayoutMeasure()',
							'undefined',
							'Runs before a root measurement pass; may fire even if this node’s dependency suppresses its final measurement.'
						],
						[
							'onLayoutMeasure(box, previous?)',
							'undefined',
							'Receives x/y min/max boxes after measurement; previous is absent on the first measure.'
						],
						[
							'onLayoutAnimationStart / onLayoutAnimationComplete',
							'undefined',
							'Observe the layout animation’s lifecycle.'
						]
					]
				},
				related: ['motion']
			},
			{
				id: 'composition-and-errors',
				title: 'Keep styles and lifecycle coherent',
				text: [
					'Give children layout when they need scale correction, and put borderRadius or boxShadow in motion style for correction during scaling. Author rotation, scale, and translation through motion style so projection can compose them; a second CSS or imperative transform owner on the same element is unsupported.',
					'Ordinary Svelte assignments, including changes after awaited data, are observed. For an imperative transaction, updateLayout(() => { ... }) snapshots coordinated participants around a synchronous mutation. Await asynchronous work before entering it; promise-returning callbacks are rejected.',
					'Layout work starts after the browser mounts the element. SSR renders the final native structure and initial animation styles; it cannot measure a box. Reduced-motion policy suppresses spatial layout animation. Horizontal viewport resizing can suppress transitions while still updating measurements.'
				],
				related: ['motion-config', 'accessibility', 'reorder']
			},
			{
				id: 'troubleshooting',
				title: 'Troubleshooting',
				points: [
					'Use a rendered block, flex, grid, or inline-block box; a non-replaced display:inline element cannot render a transform.',
					'If a resize stretches text, give the text wrapper layout="position" or animate a separate surface.',
					'SVG layout projection is not supported by the upstream layout engine. Animate SVG attributes directly instead.',
					'Keep shared IDs unique within each intended namespace. Use an explicit LayoutGroup id for reusable controls.',
					'Static 3D and perspective ancestors are supported for descendant layout changes, including nested planes, reversal, and parent scale correction. Changing the camera or 3D orientation during a layout transition, edge-on planes, and general 3D scene interpolation remain outside the qualified contract.'
				],
				text: [
					'This page teaches layout techniques. The motion reference is the primary home for element props, and LayoutGroup documents coordination and namespace inheritance.'
				],
				related: ['motion', 'layout-group', 'svg']
			}
		]
	},
	{
		slug: 'layout-group',
		title: 'LayoutGroup',
		group: 'Components',
		summary:
			'Coordinate layout measurements across components and namespace shared element identities.',
		sections: [
			{
				id: 'coordination',
				title: 'Connect independently changing siblings',
				text: [
					'LayoutGroup makes related motion elements participate in a shared measurement cohort. A sibling can animate when another component changes its size, even when that sibling’s own animation props did not change.',
					'The group renders its children directly and adds no wrapper. In this demonstration, each native details element owns its open state independently; their layout changes stay coordinated.'
				],
				example: 'layout-group-coordination',
				code: {
					label: 'Smallest group',
					source: `<script lang="ts">
  import { LayoutGroup, motion } from 'astra-motion';
</script>

<LayoutGroup>
  <motion.details layout><summary>First panel</summary><p>First content</p></motion.details>
  <motion.details layout><summary>Second panel</summary><p>Second content</p></motion.details>
</LayoutGroup>`
				}
			},
			{
				id: 'namespaces',
				title: 'Reuse a shared layout name safely',
				text: [
					'A layoutId identifies an element within its namespace. Give each repeated control a distinct LayoutGroup id, then reuse names such as "selection" inside it. The two highlights below move independently although their local layoutId strings match.',
					'An unkeyed group’s identity belongs to its mount, matching the upstream contract. Changing the id prop in place does not create a new namespace. Use a keyed block if the group’s identity really needs to change.'
				],
				example: 'layout-group-namespaces'
			},
			{
				id: 'api',
				title: 'Props and nesting',
				text: [
					'By default a nested group inherits the parent’s cohort and ID prefix. An explicit child id appends to the prefix. inherit="id" keeps the prefix while creating a separate cohort; inherit={false} starts without either inheritance.',
					'A separate cohort controls explicit group coordination. It does not hide physical reflow from Astra’s native layout observation: a node that actually moves can still be measured. An id is the way to isolate shared-element names; inherit={false} without an id does not invent a unique namespace.'
				],
				table: {
					columns: ['Prop', 'Default', 'Contract'],
					rows: [
						[
							'id',
							'undefined',
							'Namespace shared layoutId values; nested inherited IDs join parent and child with a hyphen. Mount-stable.'
						],
						[
							'inherit',
							'true',
							'true shares the parent cohort and prefix; "id" inherits the prefix only; false inherits neither. Mount-stable.'
						],
						[
							'children',
							'Required',
							'Svelte snippet rendered directly; no additional DOM element or bind:ref.'
						]
					]
				},
				code: {
					label: 'Focused excerpt — prefix without cohort inheritance',
					source: `<LayoutGroup id="workspace">
  <LayoutGroup id="tabs" inherit="id">
    <!-- Shared IDs live under workspace-tabs. -->
  </LayoutGroup>
</LayoutGroup>`
				}
			},
			{
				id: 'composition',
				title: 'Compose with presence, configuration, and Reorder',
				text: [
					'LayoutGroup does not retain exiting DOM. AnimatePresence supplies exit retention and completion, while layout participants keep their shared projection identity until removal. Reorder already coordinates item geometry; a surrounding group is useful when it participates in a larger changing layout.',
					'MotionConfig supplies inherited transition and reduced-motion policy. For a particular element, use transition.layout or layoutTransition to override layout timing. Existing explicit createLayout controllers and the layoutGroup prop remain supported for integrations that already own a controller.'
				],
				related: ['animate-presence', 'reorder', 'motion-config', 'layout']
			},
			{
				id: 'lifecycle',
				title: 'Lifecycle, SSR, and troubleshooting',
				text: [
					'Context is established during Svelte component initialization, so nested components can inherit it on the server. Browser measurement begins only after elements mount. Removing a participant unregisters it from its cohort and shared stack; removing a group does not leave a global animation loop behind.',
					'The group changes no focus behavior or document semantics. Keep native controls and stable keys, and apply reduced-motion policy for users who prefer less spatial movement.',
					'If repeated controls animate toward each other, assign distinct IDs to their groups. If a nonmoving sibling does not animate, confirm it has layout enabled and occupies a rendered box. If changing group id has no effect, recreate the group with a Svelte keyed block.'
				],
				related: ['layout', 'motion', 'accessibility']
			}
		]
	}
];
