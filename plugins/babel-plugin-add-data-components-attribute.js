'use strict';

/**
 * Modern Babel 7 + Babel 8 compatible drop-in replacement for:
 * https://github.com/lemonmade/babel-plugin-react-component-data-attribute
 *
 * Single standalone file. Preserves exact naming & snapshot parity with lemonmade:
 * - Proper Babel 8 AST builders (t.jsxAttribute || t.jSXAttribute)
 * - Safe top-level function parent detection (fixes Babel 7/8 nested .map/callback injection bug)
 * - Skips non-builtin JSX elements without leaking data-component into child elements
 * - Handles Fragments (<>, <Fragment>, <React.Fragment>)
 * - Handles Conditional/Ternary/Logical returns
 * - Full parity with React.createElement and Class component render()
 */

const { extname, basename, dirname } = require('path');

const BUILTIN_COMPONENT_REGEX = /^[a-z]+[a-z0-9-]*$/;
const DATA_ATTRIBUTE = 'data-component';

function babelPluginReactComponentDataAttribute({ types: t }) {
  const _jsxAttribute = t.jsxAttribute || t.jSXAttribute;
  const _jsxIdentifier = t.jsxIdentifier || t.jSXIdentifier;

  function createAttribute(name) {
    return _jsxAttribute.call(t, _jsxIdentifier.call(t, DATA_ATTRIBUTE), t.stringLiteral(name));
  }

  function createObjectProperty(name) {
    return t.objectProperty(t.stringLiteral(DATA_ATTRIBUTE), t.stringLiteral(name));
  }

  function fileDetails(file) {
    const filename = file && file.opts && file.opts.filename;
    if (!filename || filename === 'unknown') { return null; }
    return {
      directory: basename(dirname(filename)),
      name: basename(filename, extname(filename)),
    };
  }

  function isExported(path, name) {
    if (
      path.parentPath.isExportDefaultDeclaration() ||
      path.parentPath.isExportNamedDeclaration()
    ) { return true; }

    if (
      path.parentPath.isCallExpression() &&
      path.parentPath.parentPath &&
      (path.parentPath.parentPath.isExportDefaultDeclaration() ||
       path.parentPath.parentPath.isExportNamedDeclaration())
    ) { return true; }

    const varDecl = path.findParent((p) => p.isVariableDeclaration && p.isVariableDeclaration());
    if (varDecl && (varDecl.parentPath.isExportNamedDeclaration() || varDecl.parentPath.isExportDefaultDeclaration())) {
      return true;
    }

    if (!name) { return false; }
    const binding = path.scope.getBinding(name);

    return binding
      ? binding.referencePaths.some((referencePath) => (
        referencePath.getAncestry().some((ancestorPath) => (
          ancestorPath.isExportDefaultDeclaration() ||
          ancestorPath.isExportSpecifier() ||
          ancestorPath.isExportNamedDeclaration()
        ))
      ))
      : false;
  }

  function shouldProcessPotentialComponent(path, name, state) {
    // In Babel 7/8, getFunctionParent() is null for top-level functions.
    // If parentFn exists and is not Program, it is a nested function (.map, helper, callback) -> skip!
    const parentFn = path.getFunctionParent();
    if (parentFn && !parentFn.isProgram()) {
      return false;
    }

    if (path.parentPath.isAssignmentExpression()) { return false; }

    const { onlyRootComponents = false } = state.opts || {};
    if (!onlyRootComponents) { return true; }

    const details = fileDetails(state.file);
    if (details == null) { return false; }
    if (details.name !== 'index' && details.name.toLowerCase() !== details.directory.toLowerCase()) { return false; }

    return isExported(path, name);
  }

  function nameForReactComponent(path, file) {
    const { parentPath, node: { id } } = path;

    if (t.isIdentifier(id)) {
      return id.name;
    }

    if (parentPath.isVariableDeclarator() && t.isIdentifier(parentPath.node.id)) {
      return parentPath.node.id.name;
    }

    const details = fileDetails(file);
    if (details == null) { return details; }

    return details.name === 'index'
      ? details.directory
      : details.name;
  }

  function evaluatePotentialComponent(path, state) {
    const name = nameForReactComponent(path, state.file);
    const overrides = name && getoverrides(name, state.opts.overrides);

    let process;

    if (overrides != null && overrides.process != null) {
      process = overrides.process;
    } else {
      process = (name != null) && shouldProcessPotentialComponent(path, name, state);
    }

    return {
      name: (overrides && overrides.name) || name || '',
      process,
      overrides,
    };
  }

  function injectIntoOpening(node, name) {
    if (!t.isJSXIdentifier(node.name) || !BUILTIN_COMPONENT_REGEX.test(node.name.name)) {
      return false;
    }
    const hasDataAttribute = node.attributes.some((attribute) => (
      t.isJSXIdentifier(attribute.name, { name: DATA_ATTRIBUTE })
    ));
    if (!hasDataAttribute) {
      node.attributes.push(createAttribute(name));
      return true;
    }
    return false;
  }

  const returnStatementVisitor = {
    JSXFragment(path, { name, source }) {
      if (path.getFunctionParent() !== source) { return; }
      path.skip();

      const children = path.get('children');
      if (Array.isArray(children)) {
        children.forEach((child) => {
          if (child.isJSXElement()) {
            injectIntoOpening(child.node.openingElement, name);
          }
        });
      }
    },

    JSXElement(path, { name, source }) {
      if (path.getFunctionParent() !== source) { return; }

      // We only ever process the top-level element, never children
      path.skip();

      if (path.parentPath.isJSXExpressionContainer()) { return; }

      const openingElement = path.get('openingElement');
      const { node } = openingElement;

      // Handle <Fragment> or <React.Fragment>
      const isFrag =
        (t.isJSXIdentifier(node.name) && (node.name.name === 'Fragment' || node.name.name === 'ReactFragment')) ||
        (t.isJSXMemberExpression(node.name) &&
          t.isJSXIdentifier(node.name.object, { name: 'React' }) &&
          t.isJSXIdentifier(node.name.property, { name: 'Fragment' }));

      if (isFrag) {
        const children = path.get('children');
        if (Array.isArray(children)) {
          children.forEach((child) => {
            if (child.isJSXElement()) {
              injectIntoOpening(child.node.openingElement, name);
            }
          });
        }
        return;
      }

      injectIntoOpening(node, name);
    },

    CallExpression(path, { name, source }) {
      if (path.getFunctionParent() !== source) { return; }
      if (!path.get('callee').isMemberExpression()) { return; }
      if (!path.get('callee.object').isIdentifier({ name: 'React' })) { return; }
      if (!path.get('callee.property').isIdentifier({ name: 'createElement' })) { return; }

      const { arguments: args } = path.node;
      if (args.length === 0) { return; }

      // Check if first argument is a builtin tag string literal
      const firstArg = path.get('arguments.0');
      if (!firstArg.isStringLiteral() || !BUILTIN_COMPONENT_REGEX.test(firstArg.node.value)) {
        return;
      }

      if (args.length === 1) {
        args.push(t.objectExpression([createObjectProperty(name)]));
        return;
      }

      const secondArgument = path.get('arguments.1');
      if (!secondArgument.isObjectExpression()) { return; }

      const hasDataAttribute = secondArgument.node.properties.some((property) => (
        t.isStringLiteral(property.key, { value: DATA_ATTRIBUTE }) ||
        t.isIdentifier(property.key, { name: DATA_ATTRIBUTE })
      ));
      if (hasDataAttribute) { return; }

      secondArgument.node.properties.push(createObjectProperty(name));
    },
  };

  const functionVisitor = {
    ReturnStatement(path, { name, source, overrides }) {
      const arg = path.get('argument');
      if (!arg || !arg.node) { return; }

      if (arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name);
        if (binding == null) { return; }
        binding.path.traverse(returnStatementVisitor, { name, source, overrides });
      } else if (arg.isConditionalExpression()) {
        arg.get('consequent').traverse(returnStatementVisitor, { name, source, overrides });
        arg.get('alternate').traverse(returnStatementVisitor, { name, source, overrides });
      } else if (arg.isLogicalExpression()) {
        arg.get('right').traverse(returnStatementVisitor, { name, source, overrides });
      } else {
        path.traverse(returnStatementVisitor, { name, source, overrides });
      }
    },
  };

  const programVisitor = {
    'ClassDeclaration|ClassExpression': (path, state) => {
      const { name, process, overrides } = evaluatePotentialComponent(path, state);
      if (!process) { return; }

      path
        .get('body.body')
        .filter((bodyPath) => {
          const { key } = bodyPath.node;
          return (
            bodyPath.isClassMethod() &&
            t.isIdentifier(key) &&
            !key.computed &&
            overrides.methods.includes(key.name)
          );
        })
        .forEach((renderPath) => {
          renderPath.traverse(functionVisitor, { name, source: renderPath, overrides });
        });
    },
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': (path, state) => {
      const { name, process, overrides } = evaluatePotentialComponent(path, state);
      if (!process) { return; }

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
}

function getoverrides(component, overrides = {}) {
  const overide = overrides.hasOwnProperty(component) ? overrides[component] : {};
  return {
    name: overide.name || component,
    process: overide.process,
    methods: overide.methods || ['render'],
  };
}

module.exports = babelPluginReactComponentDataAttribute;
module.exports.default = babelPluginReactComponentDataAttribute;
