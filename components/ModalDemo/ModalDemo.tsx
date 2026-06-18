import React from 'react';
import ModalDemoScreen from './ModalDemo.screen';
import { useModalDemo } from './useModalDemo';
import { ModalDemoProps } from './types';

const ModalDemo: React.FC<ModalDemoProps> = (props) => {
  const modalController = useModalDemo(props);

  return <ModalDemoScreen {...props} {...modalController} />;
};

export default ModalDemo;
