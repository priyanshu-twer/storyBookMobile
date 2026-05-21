import React from 'react';
import { ThemeProvider } from 'styled-components';
import theme from '../theme';

const preview = {
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

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export const decorators = [
  (Story, context) => (
    <ThemeProvider theme={theme}>
      {/* Call it as a function instead of a JSX element */}
      {Story(context.args, context)}
    </ThemeProvider>
  ),
];

export default preview;
