import React from 'react';
import { ThemeProvider } from 'styled-components';
import { DocsContainer } from '@storybook/addon-docs/blocks';
import { themes } from 'storybook/theming';
import { lightTheme, darkTheme } from '../theme';

const getTheme = (themeName) => {
  return themeName === 'dark' ? darkTheme : lightTheme;
};

const ThemeWrapper = ({ themeName, children, isDocs }) => {
  const currentTheme = getTheme(themeName);
  return (
    <ThemeProvider theme={currentTheme}>
      <div
        style={{
          // backgroundColor:currentTheme.colors.background,
          color: currentTheme.colors.text,
        }}
      >
        {children}
      </div>
    </ThemeProvider>
  );
};

const CustomDocsContainer = ({ children, context }) => {
  const themeName = context?.store?.userGlobals?.globals?.theme || 'light';
  console.log(context?.store?.userGlobals?.globals?.theme)
  const docsTheme = themeName === 'dark' ? themes.dark : themes.light;
  return (
    <DocsContainer context={context} theme={docsTheme}>
      <ThemeWrapper themeName={themeName} isDocs={true}>
        {children}
      </ThemeWrapper>
    </DocsContainer>
  );
};

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
    docs: {
      container: CustomDocsContainer,
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export const decorators = [
  (Story, context) => (
    <ThemeWrapper themeName={context?.globals?.theme || 'light'} isDocs={false}>
      {Story(context.args, context)}
    </ThemeWrapper>
  ),
];

export default preview;
