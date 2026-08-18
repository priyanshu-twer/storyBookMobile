import babel from '@babel/core';
import babelPluginJsxControlFlow from '../plugins/babel-plugin-jsx-control-flow.js';

const controlFlowPlugin = () => ({
  name: 'vite-plugin-jsx-control-flow',
  enforce: 'pre',
  transform(code, id) {
    if (/\.[jt]sx?$/.test(id) && !id.includes('node_modules')) {
      const result = babel.transformSync(code, {
        filename: id,
        plugins: [babelPluginJsxControlFlow],
        configFile: false,
        babelrc: false,
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
      });
      return result ? { code: result.code, map: result.map } : null;
    }
  },
});

const config = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/react-native-web-vite',
  typescript: {
    reactDocgen: 'react-docgen',
  },
  async viteFinal(config) {
    config.plugins = config.plugins || [];
    config.plugins.unshift(controlFlowPlugin());
    return config;
  },
};

export default config;