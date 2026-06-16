import React, { forwardRef, useRef } from 'react';
import PropTypes from 'prop-types';
import { withTheme } from 'styled-components';
import { NOOP } from '../../constants/noop';
import { InputWrapper, StyledInput } from './Input.style';
import { VALIDATION_STATUS, DEFAULT_RIGHT_CLICK_DISABLE_MESSAGE } from './Input.constants';

import ValidationMessage from '../ValidationMessage/ValidationMessage';

const If = ({ condition, children }: any) => (condition ? children : null);

const Input = forwardRef((props: any, ref: any) => {
  const {
    value,
    placeholder,
    disabled,
    prefix,
    suffix,
    onChange,
    onFocus,
    onBlur,
    readOnly,
    autoFocus,
    validationStatus,
    validationMessage,
    validationIcon,
    validationIconProps,
    glow,
    noBorder,
    inputStyle,
    validationTextProps,
    wrapperProps,
    customValidation,
    disableCopyPaste,
    disableRightClickMessage,
    renderAs: RenderAs,
    validationRegex,
    maxLength,
    ...restProps
  } = props;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inputRef = ref ?? useRef(null);

  const validateInput = (inputValue: any) => validationRegex.test(inputValue);
  const stringInputValue = value?.toString?.();
  const textInputValue = stringInputValue && maxLength ? stringInputValue?.substring(0, maxLength) : stringInputValue;

  const handleOnChange = (e: any) => {
    const inputText = e?.target?.value;
    if (inputText?.length > maxLength) {
      return;
    }
    if (inputText && validationRegex && !validateInput(inputText)) {
      return;
    }
    onChange(e);
  };

  const handleDisableCopyPaste = (e: any) => {
    if (disableCopyPaste) {
      e.preventDefault();
      if (e.type === 'contextmenu') {
        alert(disableRightClickMessage);
      }
    }
  };

  return (
    <>
      <InputWrapper
        glow={glow}
        noBorder={noBorder}
        status={validationStatus}
        data-testid="input-wrapper"
        isDisabled={disabled}
        {...wrapperProps}
      >
        <If condition={prefix}>{prefix}</If>
        <RenderAs
          ref={inputRef}
          placeholder={placeholder}
          value={textInputValue}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleOnChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          status={validationStatus}
          onCopy={handleDisableCopyPaste}
          onCut={handleDisableCopyPaste}
          onPaste={handleDisableCopyPaste}
          onContextMenu={handleDisableCopyPaste}
          onDragStart={handleDisableCopyPaste}
          onDrop={handleDisableCopyPaste}
          style={{ ...inputStyle }}
          data-testid="styled-input"
          maxLength={maxLength}
          {...restProps}
        />
        <If condition={suffix}>{suffix}</If>
      </InputWrapper>
      <If condition={validationStatus && !customValidation}>
        <ValidationMessage
          validationStatus={validationStatus}
          validationMessage={validationMessage}
          validationIcon={validationIcon}
          validationIconProps={validationIconProps}
          validationTextProps={validationTextProps}
        />
      </If>
      <If condition={validationStatus && customValidation}>{customValidation}</If>
    </>
  );
});

Input.propTypes = {
  value: PropTypes.any,
  maxLength: PropTypes.number,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  autoFocus: PropTypes.bool,
  readOnly: PropTypes.bool,
  validationStatus: PropTypes.string,
  validationMessage: PropTypes.string,
  glow: PropTypes.bool,
  noBorder: PropTypes.bool,
  inputStyle: PropTypes.object,
  wrapperProps: PropTypes.object,
  validationTextProps: PropTypes.object,
  customValidation: PropTypes.node,
  renderAs: PropTypes.elementType,
  disableCopyPaste: PropTypes.bool,
  disableRightClickMessage: PropTypes.string,
  /** validation icon to be added before validation text */
  validationIcon: PropTypes.string,
  /** Props for validation icon */
  validationIconProps: PropTypes.instanceOf(Object),
  /** Pass regular expression to validate the input */
  validationRegex: PropTypes.instanceOf(RegExp),
};

Input.defaultProps = {
  value: undefined,
  maxLength: undefined,
  placeholder: undefined,
  disabled: false,
  prefix: null,
  suffix: null,
  onChange: NOOP,
  onFocus: NOOP,
  onBlur: NOOP,
  autoFocus: false,
  readOnly: false,
  validationStatus: undefined,
  validationMessage: undefined,
  glow: false,
  noBorder: false,
  inputStyle: undefined,
  wrapperProps: undefined,
  validationTextProps: undefined,
  customValidation: null,
  renderAs: StyledInput,
  disableCopyPaste: true,
  disableRightClickMessage: DEFAULT_RIGHT_CLICK_DISABLE_MESSAGE,
  validationIcon: '',
  validationIconProps: undefined,
  validationRegex: undefined,
};

/** @component */
export default withTheme(Input);
