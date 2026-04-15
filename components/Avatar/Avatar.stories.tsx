import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import Avatar from './Avatar';

const meta = {
  title: 'Avatar',
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { initials: 'AB', size: 64 },
};

export const WithUri: Story = {
  args: { uri: 'https://placekitten.com/200/200', size: 64 },
};
