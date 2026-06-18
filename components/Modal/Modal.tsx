import React from 'react';
import RNModal from 'react-native-modal';
import * as S from './Modal.styles';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
export interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  avoidKeyboard?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isVisible,
  onClose,
  title,
  children,
  avoidKeyboard = false,
}) => {
  const modalContent = (
    <S.ModalContainer>
      <S.ModalHandle />
      {title ? <S.ModalTitle>{title}</S.ModalTitle> : null}
      {children}
    </S.ModalContainer>
  );

  return (
    <RNModal
      isVisible={isVisible}
      onSwipeComplete={onClose}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      swipeDirection={['down']}
      style={{ margin: 0, justifyContent: 'flex-end' }}
      backdropTransitionOutTiming={0}
      useNativeDriverForBackdrop
      avoidKeyboard={false}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior="padding">
        {modalContent}
      </KeyboardAvoidingView>
    </RNModal>
  );
};

export default React.memo(Modal);
