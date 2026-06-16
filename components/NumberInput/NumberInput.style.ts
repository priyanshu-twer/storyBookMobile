import styled from 'styled-components';
import { NumericFormat } from 'react-number-format';

// Replicating basic input styling since we don't have the exact common/Input/Input.style path from the screenshot
export const StyledNumberInput = styled(NumericFormat)`
  flex: 1;
  padding: 10px 12px;
  border-width: 1px;
  border-color: #ccc;
  border-radius: 6px;
  font-size: 16px;
`;
