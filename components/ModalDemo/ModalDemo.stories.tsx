import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import ModalDemo from './ModalDemo';

const meta = {
  component: ModalDemo,
  tags: ['autodocs'],
  title: 'Components/ModalDemo',
  argTypes: {
    onAlertConfirm: { action: 'alertConfirm' },
    onBottomSheetOptionSelect: { action: 'bottomSheetOptionSelect' },
    onFullScreenSubmit: { action: 'fullScreenSubmit' },
  },
} satisfies Meta<typeof ModalDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
