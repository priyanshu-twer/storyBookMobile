/**
 * Custom Babel Plugin: add-data-components-attribute
 * Exact drop-in modern replacement for `lemonmade/babel-plugin-react-component-data-attribute`.
 * Dual compatible with Babel v7 and Babel v8.
 *
 * Adds `data-component="<ComponentName>"` ONLY to top-level builtin DOM elements
 * (like <svg>, <div>, <span>, <button>) returned by React components.
 */

const { extname, basename, dirname } = require('path');

const BUILTIN_COMPONENT_REGEX = /^[a-z]+[a-z0-9-]*$/;
const DATA_ATTRIBUTE = 'data-component';

module.exports = function babelPluginReactComponentDataAttribute({ types: t }) {
  // Support both Babel 7 (jsxAttribute) and Babel 8 types
  const jsxAttr = t.jsxAttribute || t.jSXAttribute;
  const jsxId = t.jsxIdentifier || t.jSXIdentifier;

  function createAttribute(name) {
    return jsxAttr.call(t, jsxId.call(t, DATA_ATTRIBUTE), t.stringLiteral(name));
  }

  function isTestOrMockFile(filename) {
    if (!filename) return false;
    return (
      /\.(test|spec)\.[jt]sx?$/.test(filename) ||
      /[\/\\](__tests__|__mocks__|mocks)[\/\\]/.test(filename) ||
      /[\/\\]node_modules[\/\\]/.test(filename)
    );
  }

  function fileDetails(filename) {
    if (!filename || filename === 'unknown') return null;
    return {
      directory: basename(dirname(filename)),
      name: basename(filename, extname(filename)),
    };
  }

  function resolveComponentName(path, file) {
    const { parentPath, node } = path;

    if (node.id && t.isIdentifier(node.id)) {
      return node.id.name;
    }

    if (parentPath && parentPath.isVariableDeclarator() && parentPath.node.id) {
      return parentPath.node.id.name;
    }

    const details = fileDetails(file && file.opts ? file.opts.filename : null);
    if (!details) return null;

    return details.name === 'index' ? details.directory : details.name;
  }

  function isMockComponent(name) {
    return (
      typeof name === 'string' &&
      (/^Mock/i.test(name) || /Mock$/i.test(name) || /^Stub/i.test(name))
    );
  }

  const returnStatementVisitor = {
    JSXElement(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;

      const openingElement = path.get('openingElement');
      const { node } = openingElement;

      // CRITICAL: Only inject on builtin DOM/HTML/SVG tags (lowercase: div, span, svg, etc.)
      // Custom React components (<Svg />, <Icon />, etc.) are NEVER injected.
      if (!t.isJSXIdentifier(node.name) || !BUILTIN_COMPONENT_REGEX.test(node.name.name)) {
        return;
      }

      // Do not traverse into child JSX elements; only process the top-level element
      path.skip();

      if (path.parentPath.isJSXExpressionContainer()) return;

      const hasAttribute = node.attributes.some(
        (attr) =>
          t.isJSXAttribute(attr) &&
          attr.name &&
          attr.name.name === DATA_ATTRIBUTE
      );
      if (hasAttribute) return;

      node.attributes.push(createAttribute(name));
    },
  };

  const functionVisitor = {
    ReturnStatement(path, { name, source }) {
      const arg = path.get('argument');
      if (arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name);
        if (binding) {
          binding.path.traverse(returnStatementVisitor, { name, source });
        }
      } else {
        path.traverse(returnStatementVisitor, { name, source });
      }
    },
  };

  function processComponent(path, state) {
    const name = resolveComponentName(path, state.file);
    if (!name || isMockComponent(name)) return;

    if (path.isArrowFunctionExpression() && !path.get('body').isBlockStatement()) {
      path.traverse(returnStatementVisitor, { name, source: path });
    } else {
      path.traverse(functionVisitor, { name, source: path });
    }
  }

  return {
    name: 'babel-plugin-add-data-components-attribute',
    visitor: {
      Program(path, state) {
        const filename = state.file && state.file.opts ? state.file.opts.filename : null;
        if (filename && isTestOrMockFile(filename)) {
          return;
        }

        path.traverse({
          ClassDeclaration(classPath) {
            const name = resolveComponentName(classPath, state.file);
            if (!name || isMockComponent(name)) return;

            classPath.get('body.body').forEach((bodyPath) => {
              if (
                bodyPath.isClassMethod() &&
                t.isIdentifier(bodyPath.node.key, { name: 'render' })
              ) {
                bodyPath.traverse(functionVisitor, { name, source: bodyPath });
              }
            });
          },

          'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(fnPath) {
            // Ignore nested non-component functions
            const parentFn = fnPath.getFunctionParent();
            if (parentFn && !parentFn.isProgram()) {
              return;
            }
            processComponent(fnPath, state);
          },
        });
      },
    },
  };
};
