import React from 'react';
import { View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import Accordion from './Accordion';

const meta = {
  component: Accordion,
  tags: ['autodocs'],
  title: 'Example/Accordion',
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'title',
    children: (
      <View>
        <Text>First line of content inside accordion</Text>
        <Text>Second line — more details</Text>
        <Text>Third line — even more details</Text>
      </View>
    ),
  },
};
