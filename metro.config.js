const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
  withStorybook,
} = require('@storybook/react-native/metro/withStorybook');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};
const defaultConfig = getDefaultConfig(__dirname);

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);
module.exports = withStorybook(mergeConfig(defaultConfig, config), {
  enabled: process.env.STORYBOOK_ENABLED === 'true',
});