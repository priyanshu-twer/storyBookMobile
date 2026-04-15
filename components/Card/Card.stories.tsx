import type { Meta, StoryObj } from '@storybook/react-native';
import React, { PropsWithChildren } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Card from './Card';

const Wrapper: React.FC<PropsWithChildren<{}>> = ({ children }) => (
  <View style={styles.wrapper}>{children}</View>
);

const meta = {
  title: 'Example/Card',
  component: Card,
  decorators: [
    (Story: any) => (
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: 'Card Title', children: <Text>Card content goes here.</Text> },
};

const styles = StyleSheet.create({ wrapper: { padding: 12 } });
