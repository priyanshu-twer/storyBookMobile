import React from 'react';
import PropTypes from 'prop-types';

/**
 * If component that conditionally renders its children when condition is truthy.
 * Supports:
 * - <If condition={true}>JSX</If>
 */
export const If = React.memo(({ condition, children }) => {
  if (!condition || !children) return null;
  return <>{children}</>;
});

If.displayName = 'If';

If.propTypes = {
  condition: PropTypes.any,
  children: PropTypes.node,
};
