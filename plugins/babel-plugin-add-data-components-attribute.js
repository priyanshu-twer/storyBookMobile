'use strict';

/**
 * Babel 7 & 8 Compatible Plugin: babel-plugin-add-data-components-attribute
 * Drop-in modern replacement for lemonmade/babel-plugin-react-component-data-attribute.
 * Injects `data-component="<ComponentName>"` on top-level DOM elements only.
 */

const { extname, basename, dirname } = require('path');

const BUILTIN_COMPONENT_REGEX = /^[a-z]+[a-z0-9-]*$/;
const DATA_ATTR = 'data-component';

function getOverrides(component, overrides = {}) {
  const o = Object.prototype.hasOwnProperty.call(overrides, component) ? overrides[component] : {};
  return { name: o.name || component, process: o.process, methods: o.methods || ['render'] };
}

module.exports = function babelPluginReactComponentDataAttribute({ types: t }) {
  const jsxAttr = t.jsxAttribute || t.jSXAttribute;
  const jsxId = t.jsxIdentifier || t.jSXIdentifier;
  const createAttribute = (name) => jsxAttr.call(t, jsxId.call(t, DATA_ATTR), t.stringLiteral(name));
  const createObjectProperty = (name) => t.objectProperty(t.stringLiteral(DATA_ATTR), t.stringLiteral(name));
  const isMockComponent = (name) => typeof name === 'string' && (/^Mock[A-Z]/.test(name) || /Mock$/.test(name));

  function fileDetails(file) {
    const f = file?.opts?.filename;
    if (!f || f === 'unknown') return null;
    return { directory: basename(dirname(f)), name: basename(f, extname(f)) };
  }

  function isExported(path, name) {
    const p = path.parentPath;
    if (p?.isExportDefaultDeclaration() || p?.isExportNamedDeclaration()) return true;
    if (p?.isCallExpression() && (p.parentPath?.isExportDefaultDeclaration() || p.parentPath?.isExportNamedDeclaration())) return true;

    const varDecl = path.findParent((parent) => parent.isVariableDeclaration?.());
    if (varDecl?.parentPath?.isExportNamedDeclaration() || varDecl?.parentPath?.isExportDefaultDeclaration()) return true;

    if (!name) return false;
    const binding = path.scope.getBinding(name);
    return Boolean(
      binding?.referencePaths.some((ref) =>
        ref.getAncestry().some((anc) => anc.isExportDefaultDeclaration() || anc.isExportSpecifier() || anc.isExportNamedDeclaration())
      )
    );
  }

  function shouldProcessPotentialComponent(path, name, state) {
    if (isMockComponent(name)) return false;

    // In Babel 7/8, getFunctionParent() is null for top-level functions. Skip nested (.map, callbacks, helpers)
    const parentFn = path.getFunctionParent();
    if (parentFn && !parentFn.isProgram()) return false;
    if (path.parentPath?.isAssignmentExpression()) return false;

    const { onlyRootComponents = false } = state.opts || {};
    if (!onlyRootComponents) return true;

    const details = fileDetails(state.file);
    if (!details || (details.name !== 'index' && details.name.toLowerCase() !== details.directory.toLowerCase())) return false;
    return isExported(path, name);
  }

  function nameForReactComponent(path, file) {
    const { parentPath, node: { id } } = path;
    if (t.isIdentifier(id)) return id.name;
    if (parentPath?.isVariableDeclarator() && t.isIdentifier(parentPath.node.id)) return parentPath.node.id.name;

    const details = fileDetails(file);
    return details ? (details.name === 'index' ? details.directory : details.name) : null;
  }

  function evaluatePotentialComponent(path, state) {
    const name = nameForReactComponent(path, state.file);
    const overrides = name && getOverrides(name, state.opts?.overrides);
    const process = overrides?.process != null ? overrides.process : Boolean(name && shouldProcessPotentialComponent(path, name, state));

    return { name: overrides?.name || name || '', process, overrides };
  }

  function injectIntoOpening(node, name) {
    if (!t.isJSXIdentifier(node?.name) || !BUILTIN_COMPONENT_REGEX.test(node.name.name)) return;
    const hasAttr = node.attributes?.some((a) => t.isJSXIdentifier(a.name, { name: DATA_ATTR }));
    if (!hasAttr) node.attributes.push(createAttribute(name));
  }

  function handleFragmentChildren(children, name) {
    if (Array.isArray(children)) {
      children.forEach((c) => c.isJSXElement() && injectIntoOpening(c.node.openingElement, name));
    }
  }

  const returnStatementVisitor = {
    JSXFragment(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;
      path.skip();
      handleFragmentChildren(path.get('children'), name);
    },

    JSXElement(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;
      path.skip(); // Never process child tree; only top-level elements

      if (path.parentPath.isJSXExpressionContainer()) return;
      const { node } = path.get('openingElement');

      const isFrag =
        (t.isJSXIdentifier(node.name) && (node.name.name === 'Fragment' || node.name.name === 'ReactFragment')) ||
        (t.isJSXMemberExpression(node.name) &&
          t.isJSXIdentifier(node.name.object, { name: 'React' }) &&
          t.isJSXIdentifier(node.name.property, { name: 'Fragment' }));

      if (isFrag) {
        handleFragmentChildren(path.get('children'), name);
      } else {
        injectIntoOpening(node, name);
      }
    },

    CallExpression(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;
      const callee = path.get('callee');
      if (!callee.isMemberExpression() || !callee.get('object').isIdentifier({ name: 'React' }) || !callee.get('property').isIdentifier({ name: 'createElement' })) return;

      const args = path.node.arguments;
      if (!args || args.length === 0) return;

      const firstArg = path.get('arguments.0');
      if (!firstArg.isStringLiteral() || !BUILTIN_COMPONENT_REGEX.test(firstArg.node.value)) return;

      if (args.length === 1) {
        args.push(t.objectExpression([createObjectProperty(name)]));
        return;
      }

      const secondArg = path.get('arguments.1');
      if (!secondArg.isObjectExpression()) return;

      const hasAttr = secondArg.node.properties.some(
        (p) => t.isStringLiteral(p.key, { value: DATA_ATTR }) || t.isIdentifier(p.key, { name: DATA_ATTR })
      );
      if (!hasAttr) secondArg.node.properties.push(createObjectProperty(name));
    },
  };

  const functionVisitor = {
    ReturnStatement(path, state) {
      const arg = path.get('argument');
      if (!arg?.node) return;

      if (arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name);
        binding?.path.traverse(returnStatementVisitor, state);
      } else if (arg.isConditionalExpression()) {
        arg.get('consequent').traverse(returnStatementVisitor, state);
        arg.get('alternate').traverse(returnStatementVisitor, state);
      } else if (arg.isLogicalExpression()) {
        arg.get('right').traverse(returnStatementVisitor, state);
      } else {
        path.traverse(returnStatementVisitor, state);
      }
    },
  };

  const programVisitor = {
    'ClassDeclaration|ClassExpression': (path, state) => {
      const { name, process, overrides } = evaluatePotentialComponent(path, state);
      if (!process) return;

      path
        .get('body.body')
        .filter((b) => b.isClassMethod() && t.isIdentifier(b.node.key) && !b.node.key.computed && overrides.methods.includes(b.node.key.name))
        .forEach((renderPath) => renderPath.traverse(functionVisitor, { name, source: renderPath, overrides }));
    },

    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': (path, state) => {
      const { name, process, overrides } = evaluatePotentialComponent(path, state);
      if (!process) return;

      if (path.isArrowFunctionExpression() && !path.get('body').isBlockStatement()) {
        path.traverse(returnStatementVisitor, { name, source: path, overrides });
      } else {
        path.traverse(functionVisitor, { name, source: path, overrides });
      }
    },
  };

  return {
    name: 'babel-plugin-react-component-data-attribute',
    visitor: {
      Program(path, state) {
        path.traverse(programVisitor, state);
      },
    },
  };
};

module.exports.default = module.exports;
