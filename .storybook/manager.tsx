import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LogoRenderer } from '../.rnstorybook/stories/LogoRenderer';

// 1. Add brandTitle to your theme so the selector has something to find
const myTheme = create({
  base: 'light',
  brandTarget: '_self',
  appBg: '#fefefe',
});

addons.setConfig({
  theme: myTheme,
})
