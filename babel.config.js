module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // './plugins/babel-plugin-jsx-control-flow',
    'transform-inline-environment-variables',
    'react-native-worklets/plugin', // must be last
  ],
};
