const babel = require('@babel/core');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const plugin = require('./babel-plugin-add-data-components-attribute.js');

function transform(code, pluginOptions = {}, transformOptions = {}) {
  return babel.transformSync(code, {
    babelrc: false,
    configFile: false,
    plugins: [[plugin, pluginOptions]],
    parserOpts: {
      plugins: ['jsx'],
    },
    ...transformOptions,
  }).code.trim();
}

console.log('🧪 Starting Lemonmade Parity Test Suite...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Basic Function Component with JSX
const code1 = transform(`
function MyComponent() {
  return <div />;
}
`);
assert(code1.includes('data-component="MyComponent"'), 'Basic function component adds data-component to div');

// 2. Component rendering another component (should NOT add data-component to CustomComponent)
const code2 = transform(`
function MyComponent() {
  return <OtherComponent />;
}
`);
assert(!code2.includes('data-component'), 'Non-DOM custom component does not receive data-component');

// 3. Arrow function expression without block
const code3 = transform(`
const MyArrow = () => <span />;
`);
assert(code3.includes('data-component="MyArrow"'), 'Arrow function without block adds data-component');

// 4. Class component render method
const code4 = transform(`
class MyClassComponent extends React.Component {
  render() {
    return <section />;
  }
  otherMethod() {
    return <div />;
  }
}
`);
assert(code4.includes('data-component="MyClassComponent"') && !code4.includes('"div",{"data-component"'), 'Class component only injects in render method');

// 5. onlyRootComponents option
const rootCode1 = transform(`
export default function CurrencyInput() {
  return <CurrencyNumberInput />;
}
`, { onlyRootComponents: true }, { filename: '/components/CurrencyInput/CurrencyInput.js' });
assert(!rootCode1.includes('data-component'), 'CurrencyInput rendering CurrencyNumberInput does not add data-component');

const rootCode2 = transform(`
export default function NumberInput() {
  return <input type="number" />;
}
`, { onlyRootComponents: true }, { filename: '/components/NumberInput/NumberInput.js' });
assert(rootCode2.includes('data-component="NumberInput"'), 'NumberInput rendering <input> gets data-component="NumberInput"');

// 6. Overrides test
const overrideCode = transform(`
class CustomCard extends React.Component {
  render() {
    return <div />;
  }
}
`, {
  overrides: {
    CustomCard: { name: 'RenamedCard' }
  }
});
assert(overrideCode.includes('data-component="RenamedCard"'), 'Overrides correctly renames component');

console.log(`\n========================================`);
console.log(`Total: ${passCount + failCount} | Passed: ${passCount} | Failed: ${failCount}`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
}
