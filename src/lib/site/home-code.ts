import rawSource from './examples/HomeLayoutExample.svelte?raw';

export const homeSource = rawSource.replaceAll("'$lib/motion/index.js'", "'astra-motion'");
export const homeSnippet = `<motion.div layout layoutGroup={layout}>\n  <strong style="display: block" {@attach layout({ mode: 'position' })}>\n    {piece.name}\n  </strong>\n</motion.div>`;
