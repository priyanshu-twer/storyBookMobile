/**
 * Custom Babel Plugin: babel-plugin-add-data-components-attribute
 * Drop-in modern replacement for `lemonmade/babel-plugin-react-component-data-attribute`
 * Dual compatible with Babel v7 and Babel v8.
 */

const { extname, basename, dirname } = require('path');

const DATA_ATTR = 'data-component';

function getOverrides(component, overrides = {}) {
  const override = Object.prototype.hasOwnProperty.call(overrides, component)
    ? overrides[component]
    : {};
  return {
    name: override.name || component,
    process: override.process,
    methods: override.methods || ['render'],
  };
}

module.exports = function babelPluginReactComponentDataAttribute({ types: t }) {
  // Dual compatibility helpers for Babel v7 and v8
  const jsxAttr = t.jsxAttribute || t.jSXAttribute;
  const jsxId = t.jsxIdentifier || t.jSXIdentifier;

  const createAttribute = name =>
    jsxAttr.call(t, jsxId.call(t, DATA_ATTR), t.stringLiteral(name));
  const createObjectProperty = name =>
    t.objectProperty(t.stringLiteral(DATA_ATTR), t.stringLiteral(name));

  const isTestOrMock = filename =>
    !filename ||
    /\.(test|spec)\.[jt]sx?$/.test(filename) ||
    /[\/\\](__tests__|__mocks__|mocks|node_modules)[\/\\]/.test(filename);

  const fileDetails = filename => {
    if (!filename || filename === 'unknown') return null;
    return {
      directory: basename(dirname(filename)),
      name: basename(filename, extname(filename)),
    };
  };

  // Original lemonmade behavior: Matches direct declaration exports only
  function isExported(path) {
    if (!path) return false;
    const parent = path.parentPath;
    if (
      parent?.isExportDefaultDeclaration() ||
      parent?.isExportNamedDeclaration()
    )
      return true;

    if (parent?.isVariableDeclarator()) {
      const grandParent = parent.parentPath;
      if (
        grandParent?.isVariableDeclaration() &&
        grandParent.parentPath?.isExportNamedDeclaration()
      ) {
        return true;
      }
    }
    return false;
  }

  function nameForReactComponent(path, file) {
    const { parentPath, node } = path;
    if (t.isIdentifier(node?.id)) return node.id.name;
    if (
      parentPath?.isVariableDeclarator() &&
      t.isIdentifier(parentPath.node.id)
    )
      return parentPath.node.id.name;
    if (
      parentPath?.isCallExpression() &&
      parentPath.parentPath?.isVariableDeclarator() &&
      t.isIdentifier(parentPath.parentPath.node.id)
    ) {
      return parentPath.parentPath.node.id.name;
    }
    const details = fileDetails(file?.opts?.filename);
    return details
      ? details.name === 'index'
        ? details.directory
        : details.name
      : null;
  }

  function shouldProcessPotentialComponent(path, name, state) {
    const parentFn = path.getFunctionParent();
    if (parentFn && !parentFn.isProgram()) return false;
    if (path.parentPath?.isAssignmentExpression()) return false;

    const { onlyRootComponents = false } = state.opts || {};
    if (!onlyRootComponents) return true;

    const details = fileDetails(state.file?.opts?.filename);
    if (!details) return false;
    if (
      details.name !== 'index' &&
      details.name.toLowerCase() !== details.directory.toLowerCase()
    )
      return false;

    return isExported(path);
  }

  function evaluatePotentialComponent(path, state) {
    const name = nameForReactComponent(path, state.file);
    const overrides = name ? getOverrides(name, state.opts?.overrides) : null;
    let process;
    if (
      overrides &&
      overrides.process !== undefined &&
      overrides.process !== null
    ) {
      process = overrides.process;
    } else {
      process =
        Boolean(name) && shouldProcessPotentialComponent(path, name, state);
    }
    return {
      name: (overrides && overrides.name) || name || '',
      process,
      overrides: overrides || { methods: ['render'] },
    };
  }

  const returnStatementVisitor = {
    JSXElement(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;
      const { node } = path.get('openingElement');

      path.skip();

      if (path.parentPath.isJSXExpressionContainer()) return;

      const hasAttr = node.attributes.some(
        a => t.isJSXAttribute(a) && a.name?.name === DATA_ATTR,
      );
      if (!hasAttr) {
        node.attributes.push(createAttribute(name));
      }
    },

    CallExpression(path, { name, source }) {
      if (path.getFunctionParent() !== source) return;
      if (!path.get('callee').isMemberExpression()) return;
      if (!path.get('callee.object').isIdentifier({ name: 'React' })) return;
      if (!path.get('callee.property').isIdentifier({ name: 'createElement' }))
        return;

      const args = path.node.arguments;
      if (!args || args.length === 0) return;

      path.skip();

      if (args.length === 1) {
        args.push(t.objectExpression([createObjectProperty(name)]));
        return;
      }

      const secondArg = path.get('arguments.1');
      if (secondArg.isObjectExpression()) {
        const hasAttr = secondArg.node.properties.some(
          p =>
            (t.isObjectProperty(p) || t.isProperty(p)) &&
            ((t.isStringLiteral(p.key) && p.key.value === DATA_ATTR) ||
              (t.isIdentifier(p.key) && p.key.name === DATA_ATTR)),
        );
        if (!hasAttr)
          secondArg.node.properties.push(createObjectProperty(name));
      } else if (
        secondArg.isNullLiteral() ||
        secondArg.isIdentifier({ name: 'undefined' })
      ) {
        path.node.arguments[1] = t.objectExpression([
          createObjectProperty(name),
        ]);
      }
    },
  };

  const functionVisitor = {
    ReturnStatement(path, { name, source, overrides }) {
      const arg = path.get('argument');
      if (arg && arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name);
        if (binding)
          binding.path.traverse(returnStatementVisitor, {
            name,
            source,
            overrides,
          });
      } else {
        path.traverse(returnStatementVisitor, { name, source, overrides });
      }
    },
  };

  const programVisitor = {
    'ClassDeclaration|ClassExpression'(path, state) {
      const { name, process, overrides } = evaluatePotentialComponent(
        path,
        state,
      );
      if (!process) return;

      path
        .get('body.body')
        .filter(
          b =>
            b.isClassMethod() &&
            t.isIdentifier(b.node.key) &&
            !b.node.key.computed &&
            overrides.methods.includes(b.node.key.name),
        )
        .forEach(renderPath => {
          renderPath.traverse(functionVisitor, {
            name,
            source: renderPath,
            overrides,
          });
        });
    },

    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(
      path,
      state,
    ) {
      const { name, process, overrides } = evaluatePotentialComponent(
        path,
        state,
      );
      if (!process) return;

      if (
        path.isArrowFunctionExpression() &&
        !path.get('body').isBlockStatement()
      ) {
        path.traverse(returnStatementVisitor, {
          name,
          source: path,
          overrides,
        });
      } else {
        path.traverse(functionVisitor, { name, source: path, overrides });
      }
    },
  };

  return {
    name: 'babel-plugin-add-data-components-attribute',
    visitor: {
      Program(path, state) {
        const filename = state.file?.opts?.filename;
        if (filename && isTestOrMock(filename)) return;
        path.traverse(programVisitor, state);
      },
    },
  };
};
