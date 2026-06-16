import styled from 'styled-components/native';
import { View, Text } from 'react-native';

export const CurrencyNumberInput = styled(View)`
  flex-direction: row;
  align-items: center;
`;

export const CurrencySymbol = styled(Text)<{ variant?: string }>`
  font-size: 16px;
  margin-right: 4px;
  font-weight: ${props => props.variant === 'H4' ? 'bold' : 'normal'};
`;
