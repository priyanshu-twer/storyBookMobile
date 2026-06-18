import styled from 'styled-components/native';
import { View, Text, Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const ModalContainer = styled(View)<{ bottomInset?: number }>`
  background-color: #ffffff;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  padding: 24px;
  padding-bottom: ${props => (props.bottomInset ? `${props.bottomInset + 16}px` : '32px')};
  max-height: ${SCREEN_HEIGHT * 0.85}px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 20px;
  elevation: 10;
`;

export const ModalHandle = styled(View)`
  width: 48px;
  height: 6px;
  border-radius: 3px;
  background-color: #e2e8f0;
  align-self: center;
  margin-bottom: 24px;
`;

export const ModalTitle = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
`;
