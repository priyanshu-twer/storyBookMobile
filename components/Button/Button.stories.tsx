import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import Button from './Button';

const meta = {
  title: 'Example/Button',
  component: Button,
  decorators: [
    Story => (
      <View style={{ padding: 12 }}>
        <Story />
      </View>
    ),
  ],
  args: { onPress: fn() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { label: 'Primary Button', primary: true },
};

export const Secondary: Story = {
  args: { label: 'Secondary Button' },
};

export const Large: Story = {
  args: { label: 'Large', size: 'large', primary: true },
};

export const Small: Story = {
  args: { label: 'Small', size: 'small' },
};
