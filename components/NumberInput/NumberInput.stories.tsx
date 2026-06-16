import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import NumberInput from './NumberInput';

const meta = {
  component: NumberInput,
  tags: ['autodocs'],
  title: 'Components/NumberInput',
  argTypes: {
    maxLength: {
      control: 'number',
    },
    decimalScale: {
      control: 'number',
    },
    allowNegative: {
      control: 'boolean',
    },
    inputMask: {
      control: 'text',
    },
    thousandsGroupStyle: {
      control: 'select',
      options: ['thousand', 'lakh', 'none'],
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof NumberInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter numbers...',
  },
};

export const WithMask: Story = {
  args: {
    inputMask: '#### #### ####',
    placeholder: 'Enter Aadhaar number...',
  },
};

export const WithDecimal: Story = {
  args: {
    decimalScale: 2,
    placeholder: 'Enter decimal value...',
  },
};

export const WithLakhStyle: Story = {
  args: {
    thousandsGroupStyle: 'lakh',
    thousandSeparator: true,
    maxLength: 7,
    value: '12345678',
    placeholder: 'Enter Lakh amount...',
  },
};

export const WithThousandStyle: Story = {
  args: {
    thousandsGroupStyle: 'thousand',
    thousandSeparator: true,
    maxLength: 7,
    value: '12345678',
    placeholder: 'Enter Western amount...',
  },
};
