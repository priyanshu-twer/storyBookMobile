import React from 'react';

const ValidationMessage = ({ validationStatus, validationMessage, validationIcon, validationIconProps, validationTextProps }: any) => {
  if (!validationMessage) return null;
  return (
    <div style={{ color: validationStatus === 'error' ? 'red' : 'inherit', fontSize: '12px', marginTop: '4px' }}>
      {validationIcon && <span {...validationIconProps}>{validationIcon}</span>}
      <span {...validationTextProps}>{validationMessage}</span>
    </div>
  );
};

export default ValidationMessage;
