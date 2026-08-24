import React from 'react';
import PropTypes from 'prop-types';
import { resolve } from './utils';

/**
 * Otherwise component to be used inside <Choose> as a default fallback.
 * Supports:
 * - <Otherwise>JSX</Otherwise>
 * - <Otherwise>{() => JSX}</Otherwise>
 * - <Otherwise render={() => JSX} />
 */
export const Otherwise = React.memo(({ children, render }) => {
  if (children !== undefined && children !== null) {
    return <>{resolve(children)}</>;
  }

  if (render) {
    return <>{resolve(render)}</>;
  }

  return null;
});

Otherwise.displayName = 'Otherwise';

Otherwise.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  render: PropTypes.func,
};

