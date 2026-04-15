import type { Preview } from '@storybook/react-native-web-vite'

const preview: Preview = {
  parameters: {
    options: {
      showPanel: false,
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;