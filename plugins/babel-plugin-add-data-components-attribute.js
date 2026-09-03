/**
 * Custom Babel Plugin: add-data-components-attribute
 * Automatically injects `data-component="<ComponentName>"` into the root JSX
 * element returned by React components. Compatible with Babel v7 and v8.
 */

module.exports = function addDataComponentPlugin(babel) {
  const { types: t } = babel;
  const ATTRIBUTE_NAME = 'data-component';

  function isTestOrMockFile(filename) {
    if (!filename) return false;
    return (
      /\.(test|spec)\.[jt]sx?$/.test(filename) ||
      /[\/\\](__tests__|__mocks__|mocks)[\/\\]/.test(filename) ||
      /[\/\\]node_modules[\/\\]/.test(filename)
    );
  }

  function isMockComponent(name) {
    return (
      typeof name === 'string' &&
      (/^Mock/i.test(name) || /Mock$/i.test(name) || /^Stub/i.test(name))
    );
  }

  function hasDataComponentAttribute(openingElement) {
    return openingElement.attributes.some(
      (attr) =>
        t.isJSXAttribute(attr) && attr.name && attr.name.name === ATTRIBUTE_NAME
    );
  }

  function isFragment(openingElement) {
    if (!openingElement || !openingElement.name) return false;
    const name = openingElement.name;
    if (t.isJSXIdentifier(name)) {
      return name.name === 'Fragment' || name.name === 'ReactFragment';
    }
    if (t.isJSXMemberExpression(name)) {
      return (
        t.isJSXIdentifier(name.object) &&
        name.object.name === 'React' &&
        t.isJSXIdentifier(name.property) &&
        name.property.name === 'Fragment'
      );
    }
    return false;
  }

  function resolveComponentName(path, state) {
    let name = null;
    const varDeclarator = path.findParent((p) => p.isVariableDeclarator());
    if (varDeclarator && varDeclarator.node.id && varDeclarator.node.id.name) {
      name = varDeclarator.node.id.name;
    }
    if (!name && path.node.id && path.node.id.name) {
      name = path.node.id.name;
    }
    if (!name && state && state.filename) {
      const parts = state.filename.split(/[\\/]/);
      const fileName = parts[parts.length - 1];
      name = fileName.replace(/\.[^/.]+$/, '');
      if (name === 'index' && parts.length > 1) {
        name = parts[parts.length - 2];
      }
    }
    return name || null;
  }

  function isPascalCase(name) {
    return typeof name === 'string' && /^[A-Z]/.test(name);
  }

  function injectAttribute(openingElement, componentName) {
    if (!openingElement || !openingElement.attributes) return;
    if (hasDataComponentAttribute(openingElement) || isFragment(openingElement)) return;

    // Unshift ensures data-component comes before {...props} so props can override it
    openingElement.attributes.unshift(
      t.jsxAttribute(
        t.jsxIdentifier(ATTRIBUTE_NAME),
        t.stringLiteral(componentName)
      )
    );
  }

  function injectIntoJSX(jsxPath, componentName) {
    if (!jsxPath) return;

    if (jsxPath.isJSXElement()) {
      injectAttribute(jsxPath.node.openingElement, componentName);
    } else if (jsxPath.isJSXFragment()) {
      const children = jsxPath.get('children');
      if (Array.isArray(children)) {
        children.forEach((child) => {
          if (child.isJSXElement()) {
            injectAttribute(child.node.openingElement, componentName);
          }
        });
      }
    }
  }

  return {
    name: 'babel-plugin-add-data-component',
    visitor: {
      Program(programPath, state) {
        // Skip test files, mock files, and node_modules
        if (state.filename && isTestOrMockFile(state.filename)) {
          return;
        }

        programPath.traverse({
          'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(fnPath) {
            const componentName = resolveComponentName(fnPath, state);
            if (
              !componentName ||
              !isPascalCase(componentName) ||
              componentName === 'Fragment' ||
              isMockComponent(componentName)
            ) {
              return;
            }

            // Arrow function with concise body: () => <View />
            if (fnPath.isArrowFunctionExpression() && fnPath.get('body').isJSXElement()) {
              injectIntoJSX(fnPath.get('body'), componentName);
              return;
            }

            // Functions with return statements
            fnPath.traverse({
              ReturnStatement(returnPath) {
                const parentFn = returnPath.getFunctionParent();
                if (parentFn !== fnPath) return;

                const arg = returnPath.get('argument');
                if (arg.isJSXElement() || arg.isJSXFragment()) {
                  injectIntoJSX(arg, componentName);
                } else if (arg.isConditionalExpression()) {
                  const consequent = arg.get('consequent');
                  const alternate = arg.get('alternate');
                  if (consequent.isJSXElement() || consequent.isJSXFragment()) {
                    injectIntoJSX(consequent, componentName);
                  }
                  if (alternate.isJSXElement() || alternate.isJSXFragment()) {
                    injectIntoJSX(alternate, componentName);
                  }
                } else if (arg.isLogicalExpression()) {
                  const right = arg.get('right');
                  if (right.isJSXElement() || right.isJSXFragment()) {
                    injectIntoJSX(right, componentName);
                  }
                }
              },
            });
          },

          ClassMethod(methodPath) {
            if (methodPath.node.key && methodPath.node.key.name === 'render') {
              const classPath = methodPath.findParent((p) => p.isClassDeclaration() || p.isClassExpression());
              const componentName = classPath ? resolveComponentName(classPath, state) : null;

              if (
                !componentName ||
                !isPascalCase(componentName) ||
                componentName === 'Fragment' ||
                isMockComponent(componentName)
              ) {
                return;
              }

              methodPath.traverse({
                ReturnStatement(returnPath) {
                  const parentFn = returnPath.getFunctionParent();
                  if (parentFn !== methodPath) return;

                  const arg = returnPath.get('argument');
                  if (arg.isJSXElement() || arg.isJSXFragment()) {
                    injectIntoJSX(arg, componentName);
                  }
                },
              });
            }
          },
        });
      },
    },
  };
};
