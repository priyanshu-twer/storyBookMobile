import type { Preview } from '@storybook/react-native';

const preview: Preview = {
  parameters: {
    options: {
      showPanel: false,
      storySort: {
        // 'Example' matches the start of your Header title 'Example/Header'
        order: ['Example', ['Header', '*'], '*'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
