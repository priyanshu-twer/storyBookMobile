const t = require('@babel/types');

// --- BABEL 8 POLYFILL FOR LEGACY PLUGINS ---
if (t) {
  const legacyJSXTypes = [
    'JSXIdentifier',
    'JSXAttribute',
    'JSXElement',
    'JSXOpeningElement',
    'JSXClosingElement',
    'JSXText',
    'JSXExpressionContainer',
    'JSXMemberExpression',
  ];

  legacyJSXTypes.forEach(type => {
    const camelCaseType = type.charAt(0).toLowerCase() + type.slice(1);
    if (!t[type] && typeof t[camelCaseType] === 'function') {
      t[type] = t[camelCaseType];
    }
  });
}
// -------------------------------------------

module.exports = api => {
  // ... your existing babel config stays untouched
};
