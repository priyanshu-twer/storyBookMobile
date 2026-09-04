'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

const _path = require('path');
const DATA_ATTRIBUTE = 'data-component';

function babelPluginReactComponentDataAttribute({ types: t }) {
  // Compatible with Babel 6, Babel 7, and Babel 8
  const jsxAttr = t.jsxAttribute || t.jSXAttribute;
  const jsxId = t.jsxIdentifier || t.jSXIdentifier;

  function createAttribute(name) {
    return jsxAttr.call(t, jsxId.call(t, DATA_ATTRIBUTE), t.stringLiteral(name));
  }

  function createObjectProperty(name) {
    return t.objectProperty(t.stringLiteral(DATA_ATTRIBUTE), t.stringLiteral(name));
  }

  function fileDetails(opts) {
    const filename =
      (opts && opts.opts && opts.opts.filename) ||
      (opts && opts.filename) ||
      (typeof opts === 'string' ? opts : null);

    if (filename === 'unknown' || filename == null) {
      return null;
    }

    return {
      directory: _path.basename(_path.dirname(filename)),
      name: _path.basename(filename, _path.extname(filename)),
    };
  }

  function isExported(path, name) {
    if (
      path.parentPath &&
      (path.parentPath.isExportDefaultDeclaration() ||
        path.parentPath.isExportNamedDeclaration())
    ) {
      return true;
    }

    if (path.parentPath && path.parentPath.isVariableDeclarator()) {
      const grandParent = path.parentPath.parentPath;
      if (
        grandParent &&
        grandParent.isVariableDeclaration() &&
        grandParent.parentPath &&
        grandParent.parentPath.isExportNamedDeclaration()
      ) {
        return true;
      }
    }

    const binding = name && path.scope ? path.scope.getBinding(name) : null;
    return binding
      ? binding.referencePaths.some(referencePath =>
          referencePath
            .getAncestry()
            .some(
              ancestorPath =>
                ancestorPath.isExportDefaultDeclaration() ||
                ancestorPath.isExportSpecifier() ||
                ancestorPath.isExportNamedDeclaration(),
            ),
        )
      : false;
  }

  function shouldProcessPotentialComponent(path, name, state) {
    // Babel 7 & Babel 8: getFunctionParent returns null for top-level functions
    const funcParent = path.getFunctionParent ? path.getFunctionParent() : null;
    if (funcParent && !funcParent.isProgram()) {
      return false;
    }

    if (path.parentPath && path.parentPath.isAssignmentExpression && path.parentPath.isAssignmentExpression()) {
      return false;
    }

    const { onlyRootComponents = false } = (state && state.opts) || {};
    if (!onlyRootComponents) {
      return true;
    }

    const details = fileDetails(state && state.file);
    if (details == null) {
      return false;
    }

    if (details.name !== 'index' && details.name !== details.directory) {
      return false;
    }

    return isExported(path, name);
  }

  function nameForReactComponent(path, file) {
    const { parentPath, node } = path;
    const id = node && node.id;

    if (t.isIdentifier(id)) {
      return id.name;
    }

    if (parentPath && parentPath.isVariableDeclarator && parentPath.isVariableDeclarator()) {
      return parentPath.node.id.name;
    }

    const details = fileDetails(file);
    if (details == null) {
      return details;
    }

    return details.name === 'index' ? details.directory : details.name;
  }

  function evaluatePotentialComponent(path, state) {
    const name = nameForReactComponent(path, state && state.file);
    const overrides =
      name && getOverrides(name, state && state.opts && state.opts.overrides);
    let process;

    if (overrides != null && overrides.process != null) {
      process = overrides.process;
    } else {
      process =
        name != null && shouldProcessPotentialComponent(path, name, state);
    }

    return {
      name: (overrides && overrides.name) || name || '',
      process,
      overrides: overrides || { methods: ['render'] },
    };
  }

  const returnStatementVisitor = {
    JSXElement(path, { name, source }) {
      // Bail early if we are in a different function than the component
      if (path.getFunctionParent && path.getFunctionParent() !== source) {
        return;
      }

      const openingElement = path.get('openingElement');
      const { node } = openingElement;

      if (!t.isJSXIdentifier(node.name) || node.name.name === 'Fragment') {
        return;
      }

      // We never want to go into a tree of JSX elements, only ever process the top-level item
      path.skip();

      // If we are in a regular prop (not children, bail out)
      if (path.parentPath && path.parentPath.isJSXExpressionContainer && path.parentPath.isJSXExpressionContainer()) {
        return;
      }

      const hasDataAttribute = node.attributes.some(attribute =>
        (t.isJSXAttribute ? t.isJSXAttribute(attribute) : true) &&
        (t.isJSXIdentifier(attribute.name, { name: DATA_ATTRIBUTE }) ||
          attribute.name?.name === DATA_ATTRIBUTE),
      );

      if (hasDataAttribute) {
        return;
      }

      node.attributes.push(createAttribute(name));
    },

    CallExpression(path, { name, source }) {
      // Bail early if we are in a different function than the component
      if (path.getFunctionParent && path.getFunctionParent() !== source) {
        return;
      }

      if (!path.get('callee').isMemberExpression()) {
        return;
      }

      if (
        !path.get('callee.object').isIdentifier({
          name: 'React',
        })
      ) {
        return;
      }

      if (
        !path.get('callee.property').isIdentifier({
          name: 'createElement',
        })
      ) {
        return;
      }

      const { arguments: args } = path.node;
      if (!args || args.length === 0) {
        return;
      }

      if (args.length === 1) {
        args.push(t.objectExpression([createObjectProperty(name)]));
        return;
      }

      const secondArgument = path.get('arguments.1');
      if (secondArgument.isObjectExpression()) {
        const hasDataAttribute = secondArgument.node.properties.some(property =>
          t.isStringLiteral(property.key, {
            value: DATA_ATTRIBUTE,
          }) ||
          (t.isIdentifier(property.key) && property.key.name === DATA_ATTRIBUTE),
        );

        if (hasDataAttribute) {
          return;
        }

        secondArgument.node.properties.push(createObjectProperty(name));
      } else if (
        secondArgument.isNullLiteral &&
        (secondArgument.isNullLiteral() ||
          secondArgument.isIdentifier({ name: 'undefined' }))
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
      if (arg && arg.node && arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name);
        if (binding == null) {
          return;
        }
        binding.path.traverse(returnStatementVisitor, {
          name,
          source,
          overrides,
        });
      } else if (arg && arg.node) {
        path.traverse(returnStatementVisitor, {
          name,
          source,
          overrides,
        });
      }
    },
  };

  const programVisitor = {
    'ClassDeclaration|ClassExpression'(path, state) {
      const { name, process, overrides } = evaluatePotentialComponent(
        path,
        state,
      );
      if (!process) {
        return;
      }

      path
        .get('body.body')
        .filter(bodyPath => {
          const { key } = bodyPath.node;
          return (
            bodyPath.isClassMethod() &&
            t.isIdentifier(key) &&
            !key.computed &&
            overrides.methods.includes(key.name)
          );
        })
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
      if (!process) {
        return;
      }

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
        path.traverse(functionVisitor, {
          name,
          source: path,
          overrides,
        });
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

function getOverrides(component, overrides = {}) {
  const override =
    overrides && Object.prototype.hasOwnProperty.call(overrides, component)
      ? overrides[component]
      : {};
  return {
    name: override.name || component,
    process: override.process,
    methods: override.methods || ['render'],
  };
}

module.exports = babelPluginReactComponentDataAttribute;
module.exports.default = babelPluginReactComponentDataAttribute;
