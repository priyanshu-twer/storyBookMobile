import React from 'react';
import PropTypes from 'prop-types';
import styled, { withTheme } from 'styled-components';

const sizes = {
  small: {
    padding: '8px 12px',
    fontSize: '12px',
  },
  medium: {
    padding: '10px 16px',
    fontSize: '14px',
  },
  large: {
    padding: '12px 20px',
    fontSize: '16px',
  },
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 48px;
  cursor: pointer;
  background-color: ${({ primary, theme, backgroundColor }) =>
    primary ? theme.colors.primary : backgroundColor || 'transparent'};
  color: ${({ primary, theme }) => (primary ? theme?.colors.onPrimary : theme?.colors.text)};
  padding: ${({ size }) => sizes[size].padding};
  font-size: ${({ size }) => sizes[size].fontSize};
  border: ${({ primary }) => (primary ? 'none' : '1px solid rgba(0, 0, 0, 0.15)')};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
`;

 const Button = ({
  label,
  primary,
  size,
  backgroundColor,
  onPress,
  disabled,
  loading,
  testID,
  accessibilityLabel,
  style,
  theme = {},
}) => {
  const handleClick = (e) => {
    if (!disabled && !loading && onPress) {
      onPress(e);
    }
  };

  return (
    <StyledButton
      type="button"
      primary={primary}
      size={size}
      backgroundColor={backgroundColor}
      onClick={handleClick}
      disabled={disabled}
      data-testid={testID}
      aria-label={accessibilityLabel}
      style={style}
    >
      {loading ? 'Loading…' : label}
    </StyledButton>
  );
};

export const ButtonPropTypes = {
  /** Text displayed inside the button */
  label: PropTypes.string.isRequired,
  /** If true, renders a primary style button */
  primary: PropTypes.bool,
  /** Size of the button */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Override background colour */
  backgroundColor: PropTypes.string,
  /** Click handler */
  onPress: PropTypes.func,
  /** Disable interaction */
  disabled: PropTypes.bool,
  /** Show loading indicator */
  loading: PropTypes.bool,
  /** Test identifier */
  testID: PropTypes.string,
  /** Accessibility label */
  accessibilityLabel: PropTypes.string,
  /** Inline style overrides */
  style: PropTypes.object,
  /** Theme object injected by withTheme */
  theme: PropTypes.object,
};
Button.propTypes = ButtonPropTypes;
Button.defaultProps = {
  primary: false,
  size: 'medium',
  backgroundColor: undefined,
  onPress: undefined,
  disabled: false,
  loading: false,
  testID: undefined,
  accessibilityLabel: undefined,
  style: undefined,
  theme: {},
};
// export { Button };
export default withTheme(Button);
