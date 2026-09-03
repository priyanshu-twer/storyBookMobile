/**
 * Custom Babel Plugin: add-data-components-attribute
 *
 * Automatically injects `data-component="<ComponentName>"` into the root JSX
 * element returned by React components. Compatible with Babel v7 and v8.
 */

module.exports = function addDataComponentPlugin(babel) {
  const { types: t } = babel;
  const ATTRIBUTE_NAME = 'data-component';

  // Checks if JSX element already has data-component (avoids overwriting)
  function hasDataComponentAttribute(openingElement) {
    return openingElement.attributes.some(
      (attr) =>
        t.isJSXAttribute(attr) &&
        attr.name &&
        attr.name.name === ATTRIBUTE_NAME
    );
  }

  // Checks if element is a Fragment (<> or <React.Fragment>)
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

  // Resolves component name from function, variable, class, or filename fallback
  function resolveComponentName(path, state) {
    let name = null;

    // Check variable declarator (e.g., const Comp = memo(...))
    const varDeclarator = path.findParent((p) => p.isVariableDeclarator());
    if (varDeclarator && varDeclarator.node.id && varDeclarator.node.id.name) {
      name = varDeclarator.node.id.name;
    }
    // Check function or class identifier
    if (!name && path.node.id && path.node.id.name) {
      name = path.node.id.name;
    }
    // Fallback: Infer name from filename for anonymous default export
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

  // Validates PascalCase (React Component naming convention)
  function isPascalCase(name) {
    return typeof name === 'string' && /^[A-Z]/.test(name);
  }

  // Injects data-component="ComponentName" into the JSX opening element
  function injectAttribute(openingElement, componentName) {
    if (!openingElement || !openingElement.attributes) return;
    if (hasDataComponentAttribute(openingElement) || isFragment(openingElement)) return;

    openingElement.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier(ATTRIBUTE_NAME),
        t.stringLiteral(componentName)
      )
    );
  }

  // Injects attribute into JSX element or fragment children
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
      // Handles function components, arrow functions, and memo/forwardRef wrappers
      'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression'(fnPath, state) {
        const componentName = resolveComponentName(fnPath, state);
        if (!componentName || !isPascalCase(componentName) || componentName === 'Fragment') {
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
              // Ternary returns: isOnline ? <OnlineView /> : <OfflineView />
              const consequent = arg.get('consequent');
              const alternate = arg.get('alternate');
              if (consequent.isJSXElement() || consequent.isJSXFragment()) {
                injectIntoJSX(consequent, componentName);
              }
              if (alternate.isJSXElement() || alternate.isJSXFragment()) {
                injectIntoJSX(alternate, componentName);
              }
            } else if (arg.isLogicalExpression()) {
              // Logical returns: isReady && <ReadyView />
              const right = arg.get('right');
              if (right.isJSXElement() || right.isJSXFragment()) {
                injectIntoJSX(right, componentName);
              }
            }
          },
        });
      },

      // Handles Class Component render() methods
      ClassMethod(methodPath, state) {
        if (methodPath.node.key && methodPath.node.key.name === 'render') {
          const classPath = methodPath.findParent((p) => p.isClassDeclaration() || p.isClassExpression());
          const componentName = classPath ? resolveComponentName(classPath, state) : null;

          if (!componentName || !isPascalCase(componentName) || componentName === 'Fragment') {
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
    },
  };
};
