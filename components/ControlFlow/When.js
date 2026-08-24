import React from 'react';
import PropTypes from 'prop-types';

/**
 * When component that conditionally renders children when condition is truthy.
 * Supports:
 * - <When condition={true}>JSX</When>
 */
export const When = React.memo(({ condition, children }) => {
  if (!condition || !children) return null;
  return <>{children}</>;
});

When.displayName = 'When';

When.propTypes = {
  condition: PropTypes.any,
  children: PropTypes.node,
};
