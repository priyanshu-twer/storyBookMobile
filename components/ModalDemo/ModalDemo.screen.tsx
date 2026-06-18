import React, { useState } from 'react';
import InputField from '../InputField/InputField';
import Modal from '../Modal';
import { ActiveModal, ModalDemoProps } from './types';
import * as S from './ModalDemo.styles';

export interface ModalDemoScreenProps extends ModalDemoProps {
  activeModal: ActiveModal;
  openModal: (type: ActiveModal) => void;
  closeModal: () => void;
  handleAlertConfirm: () => void;
  handleBottomSheetOptionSelect: (option: string) => void;
  handleFullScreenSubmit: () => void;
}

const ModalDemoScreen: React.FC<ModalDemoScreenProps> = ({
  activeModal,
  openModal,
  closeModal,
  handleAlertConfirm,
  handleBottomSheetOptionSelect,
  handleFullScreenSubmit,
}) => {
  const [inputValue, setInputValue] = useState('');

  return (
    <S.Container>
      <S.Title>Modal Showcase</S.Title>

      <S.Button variant="primary" onPress={() => openModal('alert')}>
        <S.ButtonText variant="primary">Bottom Sheet Alert</S.ButtonText>
      </S.Button>

      <S.Button variant="secondary" onPress={() => openModal('bottomSheet')}>
        <S.ButtonText variant="secondary">Bottom Sheet Selection</S.ButtonText>
      </S.Button>

      <S.Button
        variant="secondary"
        onPress={() => openModal('bottomSheetInput')}
      >
        <S.ButtonText variant="secondary">
          Bottom Sheet with TextInput
        </S.ButtonText>
      </S.Button>

      <S.Button variant="primary" onPress={() => openModal('fullScreen')}>
        <S.ButtonText variant="primary">Bottom Sheet Scrollable Document</S.ButtonText>
      </S.Button>

      {/* Bottom Sheet Alert Modal */}
      <Modal
        isVisible={activeModal === 'alert'}
        onClose={closeModal}
        title="Alert"
      >
        <S.AlertContent>
          <S.AlertIconContainer>
            <S.AlertCheckmarkText>✓</S.AlertCheckmarkText>
          </S.AlertIconContainer>
          <S.AlertTitle>Transaction Successful</S.AlertTitle>
          <S.AlertMessage>
            Your payment has been processed. You can view the confirmation
            receipt in your activity feed.
          </S.AlertMessage>
          <S.ModalSubmitButton variant="primary" onPress={handleAlertConfirm}>
            <S.ButtonText variant="primary">Acknowledge</S.ButtonText>
          </S.ModalSubmitButton>
        </S.AlertContent>
      </Modal>

      {/* Bottom Sheet Selection Modal */}
      <Modal
        isVisible={activeModal === 'bottomSheet'}
        onClose={closeModal}
        title="Select Option"
      >
        <S.OptionItem
          onPress={() => handleBottomSheetOptionSelect('Edit Profile')}
        >
          <S.OptionBullet />
          <S.OptionText>Edit Profile Details</S.OptionText>
        </S.OptionItem>

        <S.OptionItem
          onPress={() => handleBottomSheetOptionSelect('Security settings')}
        >
          <S.OptionBullet />
          <S.OptionText>Security & Credentials</S.OptionText>
        </S.OptionItem>

        <S.OptionItem
          onPress={() =>
            handleBottomSheetOptionSelect('Notifications preferences')
          }
        >
          <S.OptionBullet />
          <S.OptionText>Notifications Settings</S.OptionText>
        </S.OptionItem>
      </Modal>

      {/* Bottom Sheet Modal with TextInput */}
      <Modal
        isVisible={activeModal === 'bottomSheetInput'}
        onClose={closeModal}
        title="Edge-to-Edge Input Test"
        avoidKeyboard={true}
      >
        <>
          <S.ContentCard>
            <S.CardTitle>1. Introduction</S.CardTitle>
            <S.CardText>
              This document provides a complete guide to designing modals with
              editorial elegance. We favor clean colors, tonal variations, and
              spacing over heavy border lines.
            </S.CardText>
          </S.ContentCard>

          <S.ContentCard>
            <S.CardTitle>2. Bottom Sheets</S.CardTitle>
            <S.CardText>
              Bottom sheets should animate upward and follow user gesture
              swipes. Use a visual drag bar indicator (handle) at the top of
              the sheet.
            </S.CardText>
          </S.ContentCard>

          <S.ContentCard>
            <S.CardTitle>3. System Verification</S.CardTitle>
            <S.CardText>
              Always verify in storybook that your modal rendering behaves
              correctly on both web and ondevice emulators.
            </S.CardText>
          </S.ContentCard>
        </>
        <InputField
          label="Type something here"
          placeholder="Type value..."
          value={inputValue}
          onChangeText={setInputValue}
        />
        <S.ModalSubmitButton variant="primary" onPress={closeModal}>
          <S.ButtonText variant="primary">Submit</S.ButtonText>
        </S.ModalSubmitButton>
      </Modal>

      {/* Bottom Sheet Scrollable Document Modal */}
      <Modal
        isVisible={activeModal === 'fullScreen'}
        onClose={closeModal}
        title="Document View"
      >
        <S.ScrollBody contentContainerStyle={{ paddingBottom: 20 }}>
          <S.ContentCard>
            <S.CardTitle>1. Introduction</S.CardTitle>
            <S.CardText>
              This document provides a complete guide to designing modals with
              editorial elegance. We favor clean colors, tonal variations, and
              spacing over heavy border lines.
            </S.CardText>
          </S.ContentCard>

          <S.ContentCard>
            <S.CardTitle>2. Bottom Sheets</S.CardTitle>
            <S.CardText>
              Bottom sheets should animate upward and follow user gesture
              swipes. Use a visual drag bar indicator (handle) at the top of
              the sheet.
            </S.CardText>
          </S.ContentCard>

          <S.ContentCard>
            <S.CardTitle>3. System Verification</S.CardTitle>
            <S.CardText>
              Always verify in storybook that your modal rendering behaves
              correctly on both web and ondevice emulators.
            </S.CardText>
          </S.ContentCard>
        </S.ScrollBody>

        <S.FooterBar>
          <S.FooterButton onPress={closeModal}>
            <S.FooterButtonText>Dismiss</S.FooterButtonText>
          </S.FooterButton>
          <S.FooterButton primary onPress={handleFullScreenSubmit}>
            <S.FooterButtonText primary>Confirm Action</S.FooterButtonText>
          </S.FooterButton>
        </S.FooterBar>
      </Modal>
    </S.Container>
  );
};

export default React.memo(ModalDemoScreen);
