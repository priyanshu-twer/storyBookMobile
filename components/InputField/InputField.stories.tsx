import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import InputField from './InputField';

const meta = {
  component: InputField,
  tags: ['autodocs'],
  title: 'Example/InputField',
} satisfies Meta<typeof InputField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};