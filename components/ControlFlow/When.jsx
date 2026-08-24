import React from 'react';
import PropTypes from 'prop-types';
import { resolve } from './utils';

/**
 * When component that conditionally renders children or a render function.
 * Supports:
 * - <When condition={true}>JSX</When>
 * - <When condition={true}>{() => JSX}</When>
 * - <When condition={true} render={() => JSX} />
 */
export const When = React.memo(({ condition, children, render }) => {
  if (!condition) return null;

  if (children !== undefined && children !== null) {
    return <>{resolve(children)}</>;
  }

  if (render) {
    return <>{resolve(render)}</>;
  }

  return null;
});

When.displayName = 'When';

When.propTypes = {
  condition: PropTypes.any,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  render: PropTypes.func,
};

