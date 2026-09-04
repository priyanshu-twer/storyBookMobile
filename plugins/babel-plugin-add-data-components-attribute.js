/**
 * Custom Babel Plugin: add-data-components-attribute
 * Drop-in modern replacement for `lemonmade/babel-plugin-react-component-data-attribute`.
 * Dual compatible with Babel v7 and Babel v8.
 */

const { extname, basename, dirname } = require('path');

const BUILTIN_COMPONENT_REGEX = /^[a-z]+[a-z0-9-]*$/;
const DATA_ATTRIBUTE = 'data-component';

module.exports = function babelPluginReactComponentDataAttribute({ types: t }) {
  const jsxAttr = t.jsxAttribute || t.jSXAttribute;
  const jsxId = t.jsxIdentifier || t.jSXIdentifier;

  function createAttribute(name) {
    return jsxAttr.call(
      t,
      jsxId.call(t, DATA_ATTRIBUTE),
      t.stringLiteral(name),
    );
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

  function isExported(path, name) {
    if (!path || !path.parentPath) return false;
    if (
      path.parentPath.isExportDefaultDeclaration() ||
      path.parentPath.isExportNamedDeclaration()
    ) {
      return true;
    }

    if (!name || !path.scope) return false;
    const binding = path.scope.getBinding(name);
    return binding
      ? binding.referencePaths.some(refPath =>
          refPath
            .getAncestry()
            .some(
              ancestor =>
                ancestor.isExportDefaultDeclaration() ||
                ancestor.isExportSpecifier() ||
                ancestor.isExportNamedDeclaration(),
            ),
        )
      : false;
  }

  function resolveComponentName(path, file) {
    const { parentPath, node } = path;
    if (node && node.id && t.isIdentifier(node.id)) {
      return node.id.name;
    }
    if (parentPath && parentPath.isVariableDeclarator() && parentPath.node.id) {
      return parentPath.node.id.name;
    }
    const details = fileDetails(file && file.opts ? file.opts.filename : null);
    if (!details) return null;
    return details.name === 'index' ? details.directory : details.name;
  }

  function shouldProcessComponent(path, name, state) {
    if (!name || name === 'Fragment') return false;

    // Filter mock components (MockDivComponent, SVGIconMock, etc.)
    if (
      /^Mock/i.test(name) ||
      /Mock$/i.test(name) ||
      /^Stub/i.test(name) ||
      name === 'SVGIcon'
    ) {
      return false;
    }

    // Must be an exported component
    if (!isExported(path, name)) {
      return false;
    }

    const opts = state.opts || {};
    const onlyRoot =
      opts.onlyRootComponents !== undefined ? opts.onlyRootComponents : true;

    if (onlyRoot) {
      const details = fileDetails(
        state.file && state.file.opts ? state.file.opts.filename : null,
      );
      if (!details) return false;
      const isRootFile =
        details.name === 'index' ||
        details.name.toLowerCase() === details.directory.toLowerCase();
      if (!isRootFile) return false;
    }

    return true;
  }

  const returnStatementVisitor = {
    JSXElement(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;

      const openingElement = path.get('openingElement');
      const { node } = openingElement;

      // Only inject on lowercase builtin DOM/SVG tags (div, svg, span, button, input)
      if (
        !t.isJSXIdentifier(node.name) ||
        !BUILTIN_COMPONENT_REGEX.test(node.name.name)
      ) {
        path.skip();
        return;
      }

      // Stop traversing further down once root builtin element is found
      path.skip();

      if (path.parentPath.isJSXExpressionContainer()) return;

      const hasAttribute = node.attributes.some(
        attr =>
          t.isJSXAttribute(attr) &&
          attr.name &&
          attr.name.name === DATA_ATTRIBUTE,
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
    if (!shouldProcessComponent(path, name, state)) return;

    if (
      path.isArrowFunctionExpression() &&
      !path.get('body').isBlockStatement()
    ) {
      path.traverse(returnStatementVisitor, { name, source: path });
    } else {
      path.traverse(functionVisitor, { name, source: path });
    }
  }

  return {
    name: 'babel-plugin-add-data-components-attribute',
    visitor: {
      Program(path, state) {
        const filename =
          state.file && state.file.opts ? state.file.opts.filename : null;
        if (filename && isTestOrMockFile(filename)) {
          return;
        }

        path.traverse({
          ClassDeclaration(classPath) {
            const name = resolveComponentName(classPath, state.file);
            if (!shouldProcessComponent(classPath, name, state)) return;

            classPath.get('body.body').forEach(bodyPath => {
              if (
                bodyPath.isClassMethod() &&
                t.isIdentifier(bodyPath.node.key, { name: 'render' })
              ) {
                bodyPath.traverse(functionVisitor, { name, source: bodyPath });
              }
            });
          },

          'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(
            fnPath,
          ) {
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
