module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:storybook/recommended'],
  globals: {
    If: 'readonly',
    Else: 'readonly',
    When: 'readonly',
    Choose: 'readonly',
    Otherwise: 'readonly',
  },
};
