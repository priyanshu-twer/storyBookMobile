// transform.js
const babel = require('@babel/core');
const fs = require('fs');

// 1. Choose your input and output files
const inputFile = './App.tsx';
const outputFile = './output.js';

try {
  // 2. Transform the file
  const result = babel.transformFileSync(inputFile, {
    presets: ['module:@react-native/babel-preset'],
    plugins: ['./plugins/babel-plugin-jsx-control-flow2.js'],
    configFile: false, // ensures only your plugin runs
  });

  // 3. Save the result
  fs.writeFileSync(outputFile, result.code);
  console.log(' Transformed code successfully saved to:', outputFile);
} catch (err) {
  console.error(' Transform failed:', err);
}
