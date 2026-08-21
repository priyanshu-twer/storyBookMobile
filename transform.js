// transform.js
const babel = require('@babel/core');
const fs = require('fs');

// 1. Choose your input and output files
const inputFile = './App.tsx'; // or ./src/App.jsx
const outputFile = './output.js'; // or ./output.jsx

try {
  // 2. Transform the file for React
  const result = babel.transformFileSync(inputFile, {
    presets: [
      // Standard React preset (handles JSX, React 17/18/19 automatic runtime)
      ['@babel/preset-react', { runtime: 'automatic' }],
      // Optional: uncomment if you are transforming TypeScript (.tsx) files
      // '@babel/preset-typescript',
    ],
    plugins: [
      './plugins/babel-plugin-jsx-control-flow2.js',
    ],
    configFile: false, // Ensures only this specific config runs
  });

  // 3. Save the result
  fs.writeFileSync(outputFile, result.code);
  console.log('✅ Transformed code successfully saved to:', outputFile);
} catch (err) {
  console.error('❌ Transform failed:', err);
}
