'use strict';

const { basename, extname, dirname } = require('path');

const ATTR = 'data-component';

function getComponentName(path, file) {
  const { node, parentPath } = path;
  if (node && node.id && node.id.name) return node.id.name;

  if (parentPath) {
    if (parentPath.isVariableDeclarator && parentPath.isVariableDeclarator()) {
      if (parentPath.node.id && parentPath.node.id.name) return parentPath.node.id.name;
    }
    // Handle HOCs: React.memo(Component), React.forwardRef(Component)
    if (parentPath.isCallExpression && parentPath.isCallExpression()) {
      const grandParent = parentPath.parentPath;
      if (grandParent && grandParent.isVariableDeclarator && grandParent.isVariableDeclarator()) {
        if (grandParent.node.id && grandParent.node.id.name) return grandParent.node.id.name;
      }
      if (parentPath.node.arguments) {
        const idArg = parentPath.node.arguments.find(a => a && a.name);
        if (idArg) return idArg.name;
      }
    }
  }

  // Fallback to filename for default exports
  const filename = file && file.opts && file.opts.filename;
  if (filename && filename !== 'unknown') {
    const name = basename(filename, extname(filename));
    return name === 'index' ? basename(dirname(filename)) : name;
  }

  return null;
}

function isComponent(name) {
  return typeof name === 'string' && /^[A-Z][a-zA-Z0-9_]*$/.test(name);
}

function addDataAttr(jsxElement, name, t) {
  if (!jsxElement || jsxElement.type !== 'JSXElement') return;
  const opening = jsxElement.openingElement;
  if (!opening || !opening.name) return;

  // For Fragments, attach attribute to immediate child elements
  const tag = opening.name.name || (opening.name.property && opening.name.property.name);
  if (!tag || tag === 'Fragment' || tag === 'React.Fragment') {
    if (jsxElement.children) {
      jsxElement.children.forEach(child => addDataAttr(child, name, t));
    }
    return;
  }

  const jsxAttr = t.jsxAttribute || t.jSXAttribute;
  const jsxId = t.jsxIdentifier || t.jSXIdentifier;

  const hasAttr = opening.attributes && opening.attributes.some(
    attr =>
      attr.type === 'JSXAttribute' &&
      (attr.name && (attr.name.name === ATTR || (attr.name.name && attr.name.name.name === ATTR)))
  );

  if (!hasAttr && opening.attributes) {
    opening.attributes.push(
      jsxAttr.call(t, jsxId.call(t, ATTR), t.stringLiteral(name))
    );
  }
}

function processReturnNode(node, name, t, scope) {
  if (!node) return;
  if (node.type === 'JSXElement') {
    addDataAttr(node, name, t);
  } else if (node.type === 'ConditionalExpression') {
    processReturnNode(node.consequent, name, t, scope);
    processReturnNode(node.alternate, name, t, scope);
  } else if (node.type === 'LogicalExpression') {
    processReturnNode(node.right, name, t, scope);
  } else if (node.type === 'Identifier' && scope) {
    const binding = scope.getBinding(node.name);
    if (binding && binding.path && binding.path.isVariableDeclarator && binding.path.isVariableDeclarator()) {
      processReturnNode(binding.path.node.init, name, t, scope);
    }
  }
}

function babelPluginReactComponentDataAttribute({ types: t }) {
  return {
    name: 'babel-plugin-add-data-components-attribute',
    visitor: {
      'ClassDeclaration|ClassExpression'(path, state) {
        const name = (path.node.id && path.node.id.name) || getComponentName(path, state.file);
        if (!name || !isComponent(name)) return;
        const override = state.opts && state.opts.overrides && state.opts.overrides[name];
        if (override && override.process === false) return;
        const finalName = (override && override.name) || name;
        const methods = (state.opts && state.opts.methods) || ['render'];

        path.get('body.body').forEach(member => {
          if (member.isClassMethod && member.isClassMethod() && methods.includes(member.node.key && member.node.key.name)) {
            member.traverse({
              Function(inner) { inner.skip(); },
              ReturnStatement(ret) {
                if (ret.node.argument) processReturnNode(ret.node.argument, finalName, t, ret.scope);
              },
            });
          }
        });
      },

      Function(path, state) {
        if (path.isClassMethod && path.isClassMethod()) return;

        const name = getComponentName(path, state.file);
        if (!name || !isComponent(name)) return;

        const override = state.opts && state.opts.overrides && state.opts.overrides[name];
        if (override && override.process === false) return;
        const finalName = (override && override.name) || name;

        if (path.isArrowFunctionExpression && path.isArrowFunctionExpression() && path.node.body.type !== 'BlockStatement') {
          processReturnNode(path.node.body, finalName, t, path.scope);
          return;
        }

        path.traverse({
          Function(innerPath) {
            innerPath.skip();
          },
          ReturnStatement(retPath) {
            if (retPath.node.argument) {
              processReturnNode(retPath.node.argument, finalName, t, retPath.scope);
            }
          },
        });
      },
    },
  };
}

module.exports = babelPluginReactComponentDataAttribute;
module.exports.default = babelPluginReactComponentDataAttribute;
