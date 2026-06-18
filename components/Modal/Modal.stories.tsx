import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View, Text } from 'react-native';
import Modal from './Modal';

const meta = {
  component: Modal,
  tags: ['autodocs'],
  title: 'Components/Modal',
  argTypes: {
    onClose: { action: 'onClose' },
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isVisible: true,
    title: 'Example Bottom Sheet',
    onClose: () => {},
    children: (
      <View style={{ padding: 16 }}>
        <Text>This is a reusable bottom sheet modal!</Text>
      </View>
    ),
  },
};
