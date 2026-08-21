import React from 'react';
import { resolve } from './utils';

/**
 * If component that conditionally renders its children when condition is truthy.
 * Supports direct JSX as well as lazy render functions: () => <JSX />
 */
export const If = React.memo(({ condition, children }) => {
  if (!condition || !children) return null;

  return <>{typeof children === 'function' ? resolve(children) : children}</>;
});

If.displayName = 'If';

