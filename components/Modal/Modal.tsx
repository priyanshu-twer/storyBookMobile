import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import RNModal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as S from './Modal.styles';

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
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [avoidKeyboard]);

  const modalContent = (
    <S.ModalContainer bottomInset={isKeyboardVisible ? 0 : insets.bottom}>
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
      avoidKeyboard={false} // Disable RNModal's built-in avoidKeyboard since it conflicts with statusBarTranslucent
      statusBarTranslucent
    >
  
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ width: '100%', justifyContent: 'flex-end' }}
          enabled={isKeyboardVisible}
        >
          {modalContent}
        </KeyboardAvoidingView>
     
    </RNModal>
  );
};

export default React.memo(Modal);
