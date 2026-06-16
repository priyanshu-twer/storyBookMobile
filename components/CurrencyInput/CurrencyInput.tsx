import React from 'react';
import PropTypes from 'prop-types';
import {
  CurrencySymbols,
  DEFAULT_CURRENCY_CODE,
  ThousandsGroupStyleMapper,
} from './CurrencyInput.constants';
import { CurrencySymbol } from './CurrencyInput.style';
import NumberInput from '../NumberInput/NumberInput';

export interface CurrencyInputProps {
  currencyCode?: string;
  [key: string]: any;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  currencyCode = DEFAULT_CURRENCY_CODE,
  maxLength,
  value,
  ...restProps
}) => {
  const maxDigits =
    maxLength &&
    (maxLength < 2 ? maxLength : maxLength - Math.floor((maxLength - 2) / 3));
  const processedValue =  value?.toString().substring(0, maxDigits)

  return (
    <NumberInput
      data-testid="currency-input"
      aria-label="currency input"
      thousandSeparator
      thousandsGroupStyle={ThousandsGroupStyleMapper[currencyCode]}
      type="text"
      value={processedValue}
      maxLength={maxLength}
      prefix={
        <CurrencySymbol variant="H4" data-testid="prefix">
          {CurrencySymbols[currencyCode]}
        </CurrencySymbol>
      }
      {...restProps}
    />
  );
};

CurrencyInput.propTypes = {
  /** Currency symbol based on currency code to be prefixed - example: INR, USD, GBP */
  currencyCode: PropTypes.string,
};

CurrencyInput.defaultProps = {
  currencyCode: DEFAULT_CURRENCY_CODE,
};

/** @component */
export default CurrencyInput;
