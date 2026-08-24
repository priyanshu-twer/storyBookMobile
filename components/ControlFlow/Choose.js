import React from 'react';
import PropTypes from 'prop-types';
import { When } from './When';
import { Otherwise } from './Otherwise';

/**
 * Choose component that renders the first matching <When> child whose condition is true.
 * If no <When> condition matches, it renders the <Otherwise> child (if present).
 * Supports:
 * - <Choose><When condition={...}>JSX</When><Otherwise>JSX</Otherwise></Choose>
 */
export const Choose = React.memo(({ children }) => {
  if (!children) return null;

  const childrenArray = React.Children.toArray(children);

  // Find the first When component whose condition is true
  const match = childrenArray.find((child) => {
    if (React.isValidElement(child) && (child.type === When || child.type?.displayName === 'When')) {
      return !!child.props.condition;
    }
    return false;
  });

  if (match && React.isValidElement(match)) {
    return <>{match.props.children}</>;
  }

  // If no When matched, find the Otherwise component
  const otherwise = childrenArray.find(
    (child) => React.isValidElement(child) && (child.type === Otherwise || child.type?.displayName === 'Otherwise')
  );

  if (otherwise && React.isValidElement(otherwise)) {
    return <>{otherwise.props.children}</>;
  }

  return null;
});

Choose.displayName = 'Choose';

Choose.propTypes = {
  children: PropTypes.node,
};
