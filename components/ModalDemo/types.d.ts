export interface ModalDemoProps {
  onAlertConfirm?: () => void;
  onBottomSheetOptionSelect?: (option: string) => void;
  onFullScreenSubmit?: () => void;
}

export type ActiveModal = 'alert' | 'bottomSheet' | 'fullScreen' | 'bottomSheetInput' | null;
