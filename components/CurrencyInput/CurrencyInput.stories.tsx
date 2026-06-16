import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import CurrencyInput from './CurrencyInput';

const meta = {
  component: CurrencyInput,
  tags: ['autodocs'],
  title: 'Components/CurrencyInput',
  argTypes: {
    currencyCode: {
      control: 'select',
      options: ['INR', 'USD', 'GBP', 'EUR'],
    },
    maxLength: {
      control: 'number',
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof CurrencyInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currencyCode: 'INR',
    maxLength: 10,
    placeholder: 'Enter amount...',
  },
};

export const WithINR: Story = {
  args: {
    currencyCode: 'INR',
    maxLength: 5,
    placeholder: 'Enter INR...',
    value: "123456723238",
  },
};
export const WithINR1: Story = {
  args: {
    currencyCode: 'INR',
    // maxLength: 5,
    placeholder: 'Enter INR...',
    value: '12345677',
  },
};
