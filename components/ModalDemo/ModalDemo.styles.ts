import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export const Container = styled(View)`
  flex: 1;
  padding: 24px;
  background-color: #f4f6fa;
  justify-content: center;
  align-items: center;
`;

export const Title = styled(Text)`
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 24px;
  text-align: center;
`;

export const Button = styled(TouchableOpacity)<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  width: 85%;
  padding-vertical: 16px;
  border-radius: 16px;
  background-color: ${props => {
    switch (props.variant) {
      case 'secondary': return '#e2e8f0';
      case 'danger': return '#fee2e2';
      default: return '#1ea7fd';
    }
  }};
  margin-vertical: 8px;
  align-items: center;
  justify-content: center;
  shadow-color: ${props => (props.variant === 'primary' ? '#1ea7fd' : '#000')};
  shadow-opacity: 0.12;
  shadow-radius: 12px;
  elevation: 4;
`;

export const ButtonText = styled(Text)<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => {
    switch (props.variant) {
      case 'secondary': return '#4a5568';
      case 'danger': return '#dc2626';
      default: return '#ffffff';
    }
  }};
`;

// Alert Modal Styles
export const AlertContainer = styled(View)`
  background-color: #ffffff;
  border-radius: 24px;
  padding: 28px;
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 16px;
  elevation: 6;
`;

export const AlertContent = styled(View)`
  align-items: center;
  width: 100%;
`;

export const AlertIconContainer = styled(View)`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: #e0f2fe;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
`;

export const AlertCheckmarkText = styled(Text)`
  font-size: 32px;
  color: #1ea7fd;
  font-weight: bold;
`;

export const AlertTitle = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
  text-align: center;
`;

export const AlertMessage = styled(Text)`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  margin-bottom: 26px;
  line-height: 22px;
`;

// Bottom Sheet Styles
export const BottomSheetContainer = styled(View)`
  background-color: #ffffff;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  padding: 24px;
  padding-bottom: 48px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 20px;
  elevation: 10;
`;

export const BottomSheetHandle = styled(View)`
  width: 48px;
  height: 6px;
  border-radius: 3px;
  background-color: #e2e8f0;
  align-self: center;
  margin-bottom: 24px;
`;

export const BottomSheetTitle = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
`;

export const OptionItem = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding-vertical: 18px;
  padding-horizontal: 16px;
  border-radius: 12px;
  background-color: #f8fafc;
  margin-bottom: 12px;
`;

export const OptionBullet = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #1ea7fd;
`;

export const OptionText = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  color: #334155;
  margin-left: 12px;
`;

// Full Screen Modal Styles
export const FullScreenContainer = styled(View)`
  flex: 1;
  background-color: #f8fafc;
`;

export const HeaderBar = styled(View)`
  height: 70px;
  background-color: #ffffff;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: 20px;
  shadow-color: #000;
  shadow-opacity: 0.03;
  shadow-radius: 10px;
  elevation: 2;
`;

export const HeaderTitle = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
`;

export const CloseButton = styled(TouchableOpacity)`
  padding: 8px;
  border-radius: 8px;
  background-color: #f1f5f9;
`;

export const CloseButtonText = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: #64748b;
`;

export const ScrollBody = styled(ScrollView)`
  flex: 1;
  padding: 20px;
`;

export const ContentCard = styled(View)`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  shadow-color: #000;
  shadow-opacity: 0.02;
  shadow-radius: 8px;
  elevation: 1;
`;

export const CardTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;
`;

export const CardText = styled(Text)`
  font-size: 14px;
  color: #64748b;
  line-height: 22px;
`;

export const FooterBar = styled(View)`
  padding: 20px;
  background-color: #ffffff;
  flex-direction: row;
  justify-content: space-between;
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-radius: 15px;
  elevation: 5;
`;

export const FooterButton = styled(TouchableOpacity)<{ primary?: boolean }>`
  flex: 1;
  margin-horizontal: 8px;
  padding-vertical: 14px;
  border-radius: 12px;
  background-color: ${props => (props.primary ? '#1ea7fd' : '#f1f5f9')};
  align-items: center;
  justify-content: center;
`;

export const FooterButtonText = styled(Text)<{ primary?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => (props.primary ? '#ffffff' : '#475569')};
`;

export const InputModalContainer = styled(View)<{ bottomInset?: number }>`
  background-color: #ffffff;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  padding: 24px;
  padding-bottom: ${props => (props.bottomInset ? `${props.bottomInset + 16}px` : '32px')};
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 20px;
  elevation: 10;
`;

export const ModalSubmitButton = styled(Button)`
  width: 100%;
  margin-top: 16px;
  margin-bottom: 0px;
`;


