import React from 'react';
import PropTypes from 'prop-types';
import { resolve } from './utils';

/**
 * If component that conditionally renders its children when condition is truthy.
 * Supports:
 * - <If condition={true}>JSX</If>
 * - <If condition={true}>{() => JSX}</If>
 * - <If condition={true} render={() => JSX} />
 */
export const If = React.memo(({ condition, children, render }) => {
  if (!condition) return null;

  if (children !== undefined && children !== null) {
    return <>{resolve(children)}</>;
  }

  if (render) {
    return <>{resolve(render)}</>;
  }

  return null;
});

If.displayName = 'If';

If.propTypes = {
  condition: PropTypes.any,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  render: PropTypes.func,
};


