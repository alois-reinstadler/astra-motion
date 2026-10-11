// Experiment: deliberately tests private compiler runtime calls; never shipped.
// eslint-disable-next-line svelte/no-svelte-internal
import * as $ from 'svelte/internal/client';
import { compilerCallback } from './hooks.js';
export const template_effect = (fn, ...rest) => $.template_effect(compilerCallback(fn), ...rest);
export const user_pre_effect = (fn) => $.user_pre_effect(compilerCallback(fn));
const if_block = (node, fn, ...rest) => $.if(node, compilerCallback(fn), ...rest);
export { if_block as if };
export const each = (node, flags, getItems, ...rest) =>
	$.each(node, flags, compilerCallback(getItems), ...rest);
const await_block = (node, getInput, pending, then, rejected) =>
	$.await(
		node,
		compilerCallback(getInput),
		compilerCallback(pending),
		compilerCallback(then),
		compilerCallback(rejected)
	);
export { await_block as await };
