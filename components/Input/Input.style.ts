import styled from 'styled-components';

export const InputWrapper = styled.div<{ glow?: boolean; noBorder?: boolean; status?: string; isDisabled?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  border: ${props => props.noBorder ? 'none' : '1px solid #ccc'};
  opacity: ${props => props.isDisabled ? 0.5 : 1};
  ${props => props.glow && `box-shadow: 0 0 5px rgba(81, 203, 238, 1);`}
`;

export const StyledInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  padding: 8px;
  font-size: 14px;
`;
