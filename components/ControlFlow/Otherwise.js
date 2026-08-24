import React from 'react';
import PropTypes from 'prop-types';

/**
 * Otherwise component to be used inside <Choose> as a default fallback.
 * Supports:
 * - <Otherwise>JSX</Otherwise>
 */
export const Otherwise = React.memo(({ children }) => {
  if (!children) return null;
  return <>{children}</>;
});

Otherwise.displayName = 'Otherwise';

Otherwise.propTypes = {
  children: PropTypes.node,
};
