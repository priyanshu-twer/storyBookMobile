import React from 'react';
import { resolve } from './utils';

/**
 * Otherwise component to be used inside <Choose> as a default fallback.
 * Supports direct JSX as well as lazy render functions: () => <JSX />
 */
export const Otherwise = React.memo(({ children }) => {
  return <>{resolve(children)}</>;
});

Otherwise.displayName = 'Otherwise';
