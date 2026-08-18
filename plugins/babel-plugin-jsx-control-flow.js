module.exports = function ({ types: t }) {
  /**
   * Helper to get JSX tag name.
   */
  function getTagName(node) {
    if (t.isJSXIdentifier(node.openingElement.name)) {
      return node.openingElement.name.name;
    }
    return null;
  }

  /**
   * Helper to extract expression from a condition or test attribute.
   */
  function getConditionExpression(node) {
    const attr = node.openingElement.attributes.find(
      (a) =>
        t.isJSXAttribute(a) &&
        (a.name.name === 'condition' || a.name.name === 'test')
    );

    if (!attr || !attr.value) {
      return t.booleanLiteral(true);
    }

    if (t.isJSXExpressionContainer(attr.value)) {
      return attr.value.expression;
    }

    if (t.isStringLiteral(attr.value)) {
      return attr.value;
    }

    return t.booleanLiteral(true);
  }

  /**
   * Helper to convert an array of JSX children to a single JS expression.
   */
  function childrenToExpression(children) {
    const cleanChildren = children.filter(
      (child) => !(t.isJSXText(child) && child.value.trim() === '')
    );

    if (cleanChildren.length === 0) {
      return t.nullLiteral();
    }

    if (cleanChildren.length === 1) {
      const child = cleanChildren[0];
      if (t.isJSXElement(child) || t.isJSXFragment(child)) {
        return child;
      }
      if (t.isJSXExpressionContainer(child)) {
        return child.expression;
      }
      if (t.isJSXText(child)) {
        return t.stringLiteral(child.value);
      }
    }

    // Wrap multiple children in a JSX Fragment <>{children}</>
    return t.jsxFragment(
      t.jsxOpeningFragment(),
      t.jsxClosingFragment(),
      cleanChildren
    );
  }

  /**
   * Helper to replace a node with an expression, ensuring JSX container wrapping if inside JSX.
   */
  function replaceWithExpression(path, expression) {
    if (t.isJSXElement(path.parent) || t.isJSXFragment(path.parent)) {
      path.replaceWith(t.jsxExpressionContainer(expression));
    } else {
      path.replaceWith(expression);
    }
  }

  return {
    name: 'jsx-control-flow',
    visitor: {
      JSXElement(path) {
        const tagName = getTagName(path.node);

        // 1. Transform <If>
        if (tagName === 'If') {
          const condition = getConditionExpression(path.node);
          const thenChildren = [];
          const elseChildren = [];

          for (const child of path.node.children) {
            if (t.isJSXText(child) && child.value.trim() === '') continue;

            if (t.isJSXElement(child) && getTagName(child) === 'Else') {
              for (const elseChild of child.children) {
                if (t.isJSXText(elseChild) && elseChild.value.trim() === '') continue;
                elseChildren.push(elseChild);
              }
            } else {
              thenChildren.push(child);
            }
          }

          const consequent = childrenToExpression(thenChildren);
          const alternate = childrenToExpression(elseChildren);
          const ternary = t.conditionalExpression(condition, consequent, alternate);

          replaceWithExpression(path, ternary);
          return;
        }

        // 2. Transform <Choose>
        if (tagName === 'Choose') {
          const whenBranches = [];
          let otherwiseBranch = null;

          for (const child of path.node.children) {
            if (t.isJSXText(child) && child.value.trim() === '') continue;

            if (t.isJSXElement(child)) {
              const childTag = getTagName(child);

              if (childTag === 'When') {
                const condition = getConditionExpression(child);
                const consequent = childrenToExpression(child.children);
                whenBranches.push({ condition, consequent });
              } else if (childTag === 'Otherwise') {
                otherwiseBranch = childrenToExpression(child.children);
              }
            }
          }

          let result = otherwiseBranch || t.nullLiteral();

          // Build nested ternary from right to left
          for (let i = whenBranches.length - 1; i >= 0; i--) {
            const branch = whenBranches[i];
            result = t.conditionalExpression(
              branch.condition,
              branch.consequent,
              result
            );
          }

          replaceWithExpression(path, result);
          return;
        }
      },
    },
  };
};
