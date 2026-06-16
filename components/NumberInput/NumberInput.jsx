import React, { useRef, forwardRef } from 'react';
import PropTypes from 'prop-types';

import Input from '../Input/Input';
import { StyledNumberInput } from './NumberInput.style';
import { NOOP } from '../../constants/noop';

const NumberInput = forwardRef(
  (
    {
      inputMask,
      decimalScale,
      allowNegative,
      onValueChange = NOOP,
      maxLength,
      value,
      ...props
    },
    ref,
  ) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const numberInputRef = ref ?? useRef(null);

    

    return (
      <Input
        ref={numberInputRef}
        renderAs={StyledNumberInput}
        data-testid="number-input"
        aria-label="number input"
        type="tel"
        decimalScale={decimalScale}
        inputMode="decimal"
        allowNegative={allowNegative}
        format={inputMask}
        onValueChange={onValueChange}
        value={value}
        maxLength={maxLength}
        {...props}
      />
    );
  },
);

NumberInput.propTypes = {
  /** Allows to enter format numbers (ex: Aadhaar number, credit card number) */
  inputMask: PropTypes.string,
  /** Allows to enter decimal value. */
  decimalScale: PropTypes.number,
  /** Allows to enter negative value. */
  allowNegative: PropTypes.bool,
  /** Triggers when number input value changes */
  onValueChange: PropTypes.func,
};

NumberInput.defaultProps = {
  inputMask: undefined,
  decimalScale: 0,
  allowNegative: false,
  onValueChange: NOOP,
};

/** @component */
export default NumberInput;
