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

  const createAttribute = (name) =>
    jsxAttr.call(t, jsxId.call(t, DATA_ATTRIBUTE), t.stringLiteral(name));

  const isTestOrMock = (f) =>
    !f ||
    /\.(test|spec)\.[jt]sx?$/.test(f) ||
    /[\/\\](__tests__|__mocks__|mocks|node_modules)[\/\\]/.test(f);

  const fileDetails = (f) => {
    if (!f || f === 'unknown') return null;
    return {
      directory: basename(dirname(f)),
      name: basename(f, extname(f)),
    };
  };

  function isExported(path, name) {
    if (!path || !path.parentPath) return false;
    if (path.parentPath.isExportDefaultDeclaration() || path.parentPath.isExportNamedDeclaration()) {
      return true;
    }
    if (!name || !path.scope) return false;
    const binding = path.scope.getBinding(name);
    return binding
      ? binding.referencePaths.some((ref) =>
          ref.getAncestry().some((a) =>
            a.isExportDefaultDeclaration() || a.isExportSpecifier() || a.isExportNamedDeclaration()
          )
        )
      : false;
  }

  function resolveComponentName(path, file) {
    const { parentPath, node } = path;
    if (node?.id && t.isIdentifier(node.id)) return node.id.name;
    if (parentPath?.isVariableDeclarator() && parentPath.node.id) return parentPath.node.id.name;
    if (parentPath?.isCallExpression() && parentPath.parentPath?.isVariableDeclarator()) {
      return parentPath.parentPath.node.id.name;
    }
    const details = fileDetails(file?.opts?.filename);
    if (!details) return null;
    return details.name === 'index' ? details.directory : details.name;
  }

  function shouldProcessComponent(path, name, state) {
    if (!name || name === 'Fragment') return false;
    if (/^(Mock|Stub)/i.test(name) || /Mock$/i.test(name) || name === 'SVGIcon') return false;
    if (!isExported(path, name)) return false;

    const opts = state.opts || {};
    const onlyRoot = opts.onlyRootComponents !== undefined ? opts.onlyRootComponents : true;
    if (onlyRoot) {
      const d = fileDetails(state.file?.opts?.filename);
      if (!d || (d.name !== 'index' && d.name.toLowerCase() !== d.directory.toLowerCase())) {
        return false;
      }
    }
    return true;
  }

  const returnStatementVisitor = {
    JSXElement(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;
      const { node } = path.get('openingElement');

      // Only inject on lowercase DOM/SVG tags (input, div, svg, span, button)
      if (!t.isJSXIdentifier(node.name) || !BUILTIN_COMPONENT_REGEX.test(node.name.name)) {
        path.skip();
        return;
      }
      path.skip();
      if (path.parentPath.isJSXExpressionContainer()) return;

      const exists = node.attributes.some(
        (a) => t.isJSXAttribute(a) && a.name?.name === DATA_ATTRIBUTE
      );
      if (!exists) node.attributes.push(createAttribute(name));
    },
  };

  const functionVisitor = {
    ReturnStatement(path, { name, source }) {
      const arg = path.get('argument');
      if (arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name);
        binding?.path.traverse(returnStatementVisitor, { name, source });
      } else {
        path.traverse(returnStatementVisitor, { name, source });
      }
    },
  };

  function processComponent(path, state) {
    const name = resolveComponentName(path, state.file);
    if (!shouldProcessComponent(path, name, state)) return;
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
        const filename = state.file?.opts?.filename;
        if (filename && isTestOrMock(filename)) return;

        path.traverse({
          ClassDeclaration(classPath) {
            const name = resolveComponentName(classPath, state.file);
            if (!shouldProcessComponent(classPath, name, state)) return;
            classPath.get('body.body').forEach((b) => {
              if (b.isClassMethod() && t.isIdentifier(b.node.key, { name: 'render' })) {
                b.traverse(functionVisitor, { name, source: b });
              }
            });
          },
          'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(fnPath) {
            const parentFn = fnPath.getFunctionParent();
            if (parentFn && !parentFn.isProgram()) return;
            processComponent(fnPath, state);
          },
        });
      },
    },
  };
};
