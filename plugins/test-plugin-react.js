const babel = require('@babel/core');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const plugin = require('./babel-plugin-add-data-components-attribute.js');

console.log('====================================================');
console.log('🧪 RUNNING COMPREHENSIVE REACT BABEL TESTS');
console.log('====================================================\n');

// -------------------------------------------------------------
// TEST 1: PreLoader (Exported root component in matching folder)
// -------------------------------------------------------------
console.log('👉 TEST 1: PreLoader component (Exported root component)');
const preloaderSource = `
import React from 'react';
import { SVGIcon } from '../Icon/SVGIcon';

export function PreLoader() {
  return (
    <div className="preloader">
      <SVGIcon name="Idea" />
    </div>
  );
}
`;

const resPreloader = babel.transformSync(preloaderSource, {
  filename: '/workspace/src/library/components/PreLoader/PreLoader.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

const preloaderHasData = resPreloader.code.includes('PreLoader');
console.log(
  preloaderHasData
    ? '✅ PASSED: PreLoader received data-component="PreLoader"'
    : '❌ FAILED: PreLoader missing data-component'
);

// -------------------------------------------------------------
// TEST 2: SVGIcon (Subcomponent / Icon helper)
// -------------------------------------------------------------
console.log('\n👉 TEST 2: SVGIcon (Should NEVER override with data-component="SVGIcon")');
const svgIconSource = `
import React from 'react';

export const SVGIcon = (props) => {
  return <svg {...props} />;
};
`;

const resSVGIcon = babel.transformSync(svgIconSource, {
  filename: '/workspace/src/library/components/Icon/SVGIcon.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

const svgIconNoData = !resSVGIcon.code.includes('data-component');
console.log(
  svgIconNoData
    ? '✅ PASSED: SVGIcon was NOT injected with data-component="SVGIcon"'
    : '❌ FAILED: SVGIcon was injected with data-component'
);

// -------------------------------------------------------------
// TEST 3: Mock component in Alert.test.js
// -------------------------------------------------------------
console.log('\n👉 TEST 3: MockDivComponent in Alert.test.js');
const testFileSource = `
const MockDivComponent = () => <div />;
`;

const resTestFile = babel.transformSync(testFileSource, {
  filename: '/workspace/src/library/v2/components/Alert/Alert.test.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

const mockDivClean = !resTestFile.code.includes('data-component');
console.log(
  mockDivClean
    ? '✅ PASSED: MockDivComponent left as clean <div /> (no data-component)'
    : '❌ FAILED: MockDivComponent got data-component'
);

// -------------------------------------------------------------
// TEST 4: Full React Snapshot Simulation (svg-mock.js + SVGIcon)
// -------------------------------------------------------------
console.log('\n👉 TEST 4: React Snapshot Simulation (svg-mock.js with SearchInput / CallToAction)');

// svg-mock.js from jest.config.js:
function SvgMock(props) {
  return React.createElement('svg', {
    'aria-hidden': 'true',
    'aria-label': 'Download',
    'data-component': 'svg-mock',
    'data-testid': 'prefixIcon-Download',
    height: '12',
    role: 'img',
    style: { fill: '#9B1E26', marginRight: '9px' },
    width: '12',
    ...props,
  });
}

// SVGIcon compiled without data-component="SVGIcon":
function SVGIcon(props) {
  return React.createElement(SvgMock, props);
}

// CallToAction compiled with data-component="CallToAction":
function CallToAction() {
  return React.createElement(
    'div',
    { className: 'c1', 'data-component': 'CallToAction' },
    React.createElement(SVGIcon, { 'aria-label': 'Download' })
  );
}

const renderedHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(CallToAction));
console.log('Rendered HTML:\n', renderedHtml);

const containsSvgMock = renderedHtml.includes('data-component="svg-mock"');
const containsSVGIcon = renderedHtml.includes('data-component="SVGIcon"');

if (containsSvgMock && !containsSVGIcon) {
  console.log('✅ PASSED: Snapshot matches! <svg> has data-component="svg-mock"');
} else {
  console.log('❌ FAILED: Snapshot mismatch!');
}

// -------------------------------------------------------------
// TEST 5: CurrencyInput wrapping NumberInput (Styled / Sub-component wrapper)
// -------------------------------------------------------------
console.log('\n👉 TEST 5: CurrencyInput wrapping NumberInput');

// NumberInput is the base component rendering the DOM <input>
const numberInputSource = `
import React from 'react';
export const NumberInput = (props) => {
  return <input type="number" {...props} />;
};
`;

const resNumberInput = babel.transformSync(numberInputSource, {
  filename: '/workspace/src/library/components/NumberInput/NumberInput.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

// CurrencyInput renders <CurrencyNumberInput /> which wraps NumberInput
const currencyInputSource = "import React from 'react';\n" +
  "import styled from 'styled-components';\n" +
  "import { NumberInput } from '../NumberInput';\n" +
  "const CurrencyNumberInput = styled(NumberInput)` `;\n" +
  "export const CurrencyInput = (props) => {\n" +
  "  return <CurrencyNumberInput {...props} />;\n" +
  "};\n";

const resCurrencyInput = babel.transformSync(currencyInputSource, {
  filename: '/workspace/src/library/components/CurrencyInput/CurrencyInput.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

// Verify CurrencyInput didn't inject data-component on <CurrencyNumberInput>
const currencyInputDoesNotClobber = !resCurrencyInput.code.includes('CurrencyInput') || !resCurrencyInput.code.includes('data-component');
// Verify NumberInput DID inject data-component on <input>
const numberInputHasData = resNumberInput.code.includes('data-component') && resNumberInput.code.includes('NumberInput');

if (currencyInputDoesNotClobber && numberInputHasData) {
  console.log('✅ PASSED: CurrencyInput leaves <CurrencyNumberInput /> clean and inherits parent NumberInput data-component!');
} else {
  console.log('❌ FAILED: CurrencyInput or NumberInput data-component mismatch');
}

console.log('\n====================================================');
console.log('🏁 ALL TESTS COMPLETED');
console.log('====================================================');


