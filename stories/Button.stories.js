import React from 'react';
import {Button} from './Button';

export default {
  title: 'Component/ButtonJS',
  component: Button,
    tags:  ['autodocs'],
}

export const Primary = {
  args: {
    label: 'Primary Button',
    primary: true,
    size: 'medium',
  },
  render: (args) => (
    <Button {...args} />
  )
};
