import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import Text from './Text';

const meta = {
  component: Text,
  tags: ['autodocs'],
  title: 'Example/Text',
  
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "h1",
    color: "#9b3636",
    children: "Hello World"
  }
};