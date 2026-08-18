import React from 'react';
import { resolve } from './utils';

/**
 * When component to be used inside <Choose> or as a conditional wrapper.
 * Supports direct JSX as well as lazy render functions: () => <JSX />
 */
export const When = React.memo(({ condition, children }) => {
  return condition ? <>{resolve(children)}</> : null;
});

When.displayName = 'When';
