import React from 'react';
import { Else } from './Else';
import { resolve } from './utils';

/**
 * If component that conditionally renders its children.
 * Supports direct JSX as well as lazy render functions: () => <JSX />
 */
export const If = React.memo(({ condition, children }) => {
  if (!children) return null;

  // If children is passed directly as a function: <If condition={c}>{() => <JSX />}</If>
  if (typeof children === 'function') {
    return condition ? resolve(children) : null;
  }

  const childrenArray = React.Children.toArray(children);

  // Find the Else component (if any)
  const elseChild = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === Else
  );

  if (condition) {
    // Render all children except the Else component
    const thenChildren = childrenArray
      .filter((child) => !(React.isValidElement(child) && child.type === Else))
      .map((child) => (typeof child === 'function' ? child() : child));
    return <>{thenChildren}</>;
  } else {
    // Render the Else component (which renders its own children) or null if not present
    return elseChild || null;
  }
});

If.displayName = 'If';
