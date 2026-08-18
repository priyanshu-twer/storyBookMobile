/**
 * Helper to resolve children whether they are direct JSX elements or lazy render functions.
 */
export const resolve = (node) => (typeof node === 'function' ? node() : node);
