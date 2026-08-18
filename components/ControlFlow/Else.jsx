import React from 'react';
import { resolve } from './utils';

/**
 * Else component to be used inside <If> or as part of control flow.
 * Supports direct JSX as well as lazy render functions: () => <JSX />
 */
export const Else = React.memo(({ children }) => {
  return <>{resolve(children)}</>;
});

Else.displayName = 'Else';
