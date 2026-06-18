import { useState, useCallback } from 'react';
import { ActiveModal, ModalDemoProps } from './types';

export const useModalDemo = (props: ModalDemoProps) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const openModal = useCallback((type: ActiveModal) => {
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleAlertConfirm = useCallback(() => {
    if (props.onAlertConfirm) {
      props.onAlertConfirm();
    }
    closeModal();
  }, [props.onAlertConfirm, closeModal]);

  const handleBottomSheetOptionSelect = useCallback(
    (option: string) => {
      if (props.onBottomSheetOptionSelect) {
        props.onBottomSheetOptionSelect(option);
      }
      closeModal();
    },
    [props.onBottomSheetOptionSelect, closeModal]
  );

  const handleFullScreenSubmit = useCallback(() => {
    if (props.onFullScreenSubmit) {
      props.onFullScreenSubmit();
    }
    closeModal();
  }, [props.onFullScreenSubmit, closeModal]);

  return {
    activeModal,
    openModal,
    closeModal,
    handleAlertConfirm,
    handleBottomSheetOptionSelect,
    handleFullScreenSubmit,
  };
};
