import Button, { ButtonPropTypes } from './Button';

export default {
  title: 'Component/ButtonJS',
  component: Button,
  tags: ['autodocs'],
  argTypes: ButtonPropTypes,
};

export const Primary = {
  args: {
    label: 'Primary Button',
    primary: true,
    size: 'medium',
  },
  render: args => <Button {...args} />,
};
