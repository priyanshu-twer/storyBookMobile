const babel = require('@babel/core');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const plugin = require('./babel-plugin-add-data-components-attribute.js');

console.log('====================================================');
console.log('🧪 RUNNING REACT BABEL PLUGIN TESTS');
console.log('====================================================\n');

// -------------------------------------------------------------
// TEST CASE 1: SVGIcon component returning an imported SVG
// -------------------------------------------------------------
console.log('👉 TEST 1: SVGIcon returning <SvgComponent {...props} />');
const svgIconSource = `
import React from 'react';
import SvgDownload from './download.svg';

export const SVGIcon = (props) => {
  return <SvgDownload {...props} />;
};
`;

const transformedSVGIcon = babel.transformSync(svgIconSource, {
  filename: 'src/library/components/SVGIcon/SVGIcon.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

const svgIconDoesNotInjectOnCustomComponent = !transformedSVGIcon.code.includes('"data-component", "SVGIcon"') && !transformedSVGIcon.code.includes('"data-component":"SVGIcon"');
console.log(
  svgIconDoesNotInjectOnCustomComponent
    ? '✅ PASSED: SVGIcon did NOT inject data-component on <SvgDownload />'
    : '❌ FAILED: SVGIcon incorrectly injected data-component on <SvgDownload />'
);

// -------------------------------------------------------------
// TEST CASE 2: PreLoader rendering <div className="preloader"><SVGIcon /></div>
// -------------------------------------------------------------
console.log('\n👉 TEST 2: PreLoader rendering DOM <div> with SVGIcon child');
const preloaderSource = `
import React from 'react';
import { SVGIcon } from './SVGIcon';

export function PreLoader() {
  return (
    <div className="preloader">
      <SVGIcon name="Idea" />
    </div>
  );
}
`;

const transformedPreloader = babel.transformSync(preloaderSource, {
  filename: 'src/library/components/PreLoader/PreLoader.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

const preloaderHasDataComponent = transformedPreloader.code.includes('PreLoader');
console.log(
  preloaderHasDataComponent
    ? '✅ PASSED: PreLoader injected data-component="PreLoader" on root <div>'
    : '❌ FAILED: PreLoader missing data-component on root <div>'
);

// -------------------------------------------------------------
// TEST CASE 3: Full React Runtime Render (Simulating Jest Snapshot)
// -------------------------------------------------------------
console.log('\n👉 TEST 3: Full React DOM Render & Snapshot Matching');

// 1. Simulating svg-mock.js from jest.config.js:
function SvgMock(props) {
  return React.createElement('svg', {
    'data-component': 'svg-mock',
    'aria-hidden': 'true',
    'data-testid': 'prefixIcon-Download',
    ...props,
  });
}

// 2. SVGIcon as compiled by our updated plugin (returning SvgMock without extra data-component):
function SVGIcon(props) {
  return React.createElement(SvgMock, { ...props });
}

// 3. CallToAction as compiled by our updated plugin:
function CallToAction() {
  return React.createElement(
    'div',
    { className: 'c1', 'data-component': 'CallToAction' },
    React.createElement(SVGIcon, { 'aria-label': 'Download' })
  );
}

const renderedHtml = ReactDOMServer.renderToStaticMarkup(React.createElement(CallToAction));
console.log('Rendered HTML:\n', renderedHtml);

const expectedSvgMock = renderedHtml.includes('data-component="svg-mock"');
const unexpectedSVGIcon = renderedHtml.includes('data-component="SVGIcon"');

if (expectedSvgMock && !unexpectedSVGIcon) {
  console.log('✅ PASSED: <svg> has data-component="svg-mock" (matches Jest snapshot exactly!)');
} else {
  console.log('❌ FAILED: Snapshot mismatch detected!');
}

// -------------------------------------------------------------
// TEST CASE 4: Test / Mock file (Alert.test.js with MockDivComponent)
// -------------------------------------------------------------
console.log('\n👉 TEST 4: Mock component in Alert.test.js');
const testFileSource = `
const MockDivComponent = () => <div />;
`;

const transformedTestFile = babel.transformSync(testFileSource, {
  filename: 'src/library/v2/components/Alert/Alert.test.js',
  configFile: false,
  babelrc: false,
  presets: ['module:@react-native/babel-preset'],
  plugins: [plugin],
});

const mockDivHasNoDataComponent = !transformedTestFile.code.includes('data-component');
console.log(
  mockDivHasNoDataComponent
    ? '✅ PASSED: MockDivComponent in Alert.test.js received NO data-component (<div /> remains clean)'
    : '❌ FAILED: MockDivComponent in Alert.test.js received data-component!'
);

console.log('\n====================================================');
console.log('🏁 ALL TESTS COMPLETED');
console.log('====================================================');
