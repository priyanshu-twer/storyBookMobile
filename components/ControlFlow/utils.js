/**
 * Helper to resolve children whether they are direct JSX elements or lazy render functions.
 * Also handles error cases where functions might throw during evaluation.
 */
export const resolve = (node) => {
  if (typeof node === 'function') {
    try {
      return node();
    } catch {
      return null;
    }
  }
  return node;
};

