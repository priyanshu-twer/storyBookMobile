import React from 'react';
import { When } from './When';
import { Otherwise } from './Otherwise';
import { resolve } from './utils';

/**
 * Choose component that renders the first matching <When> child whose condition is true.
 * If no <When> condition matches, it renders the <Otherwise> child (if present).
 * Supports direct JSX as well as lazy render functions: () => <JSX />
 */
export const Choose = React.memo(({ children }) => {
  if (!children) return null;

  const childrenArray = React.Children.toArray(children);

  // Find the first When component whose condition is true
  const match = childrenArray.find((child) => {
    if (React.isValidElement(child) && child.type === When) {
      return !!child.props.condition;
    }
    return false;
  });

  if (match) {
    return <>{resolve(match)}</>;
  }

  // If no When matched, find the Otherwise component
  const otherwise = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === Otherwise
  );

  return otherwise ? <>{resolve(otherwise)}</> : null;
});

Choose.displayName = 'Choose';
