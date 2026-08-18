module.exports = function ({ types: t }) {
  /**
   * Helper to get JSX tag name.
   */
  function getTagName(node) {
    if (node && t.isJSXElement(node) && t.isJSXIdentifier(node.openingElement.name)) {
      return node.openingElement.name.name;
    }
    return null;
  }

  /**
   * Helper: Check if a node is a JSX element with a given tag name.
   */
  function isTag(node, tagName) {
    return t.isJSXElement(node) && getTagName(node) === tagName;
  }

  /**
   * Helper to extract expression from condition/test attributes or boolean flags.
   */
  function getConditionExpression(node) {
    const attr = node.openingElement.attributes.find(
      a =>
        t.isJSXAttribute(a) &&
        (a.name.name === 'condition' || a.name.name === 'test' || a.name.name === 'is'),
    );

    if (!attr) {
      return t.booleanLiteral(true);
    }

    if (attr.value === null) {
      return t.booleanLiteral(true);
    }

    if (t.isJSXExpressionContainer(attr.value)) {
      if (t.isJSXEmptyExpression(attr.value.expression)) {
        return t.booleanLiteral(true);
      }
      return attr.value.expression;
    }

    if (t.isStringLiteral(attr.value)) {
      return attr.value;
    }

    return t.booleanLiteral(true);
  }

  /**
   * Helper to convert JSX children to an expression without destroying inline whitespace.
   */
  function childrenToExpression(children) {
    // Only strip pure newline formatting whitespace; preserve single spaces (" ")
    const cleanChildren = children.filter(
      child => !(t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)),
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

    // Convert child array expressions for exact snapshot matching
    const expressions = cleanChildren.map(child => {
      if (t.isJSXExpressionContainer(child)) {
        return child.expression;
      }
      if (t.isJSXText(child)) {
        return t.stringLiteral(child.value);
      }
      return child;
    });

    return t.arrayExpression(expressions);
  }

  return {
    name: 'jsx-control-flow',
    visitor: {
      JSXElement(path) {
        const tagName = getTagName(path.node);

        // 1. Transform <If>
        if (tagName === 'If') {
          const condition = getConditionExpression(path.node);
          const ifChildren = [];
          const elseChildren = [];
          let currentTarget = ifChildren;

          for (const child of path.node.children) {
            if (t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)) continue;

            if (isTag(child, 'Else')) {
              currentTarget = elseChildren;
              if (child.children && child.children.length > 0) {
                for (const elseChild of child.children) {
                  if (t.isJSXText(elseChild) && /^\s*[\r\n]+\s*$/.test(elseChild.value)) continue;
                  elseChildren.push(elseChild);
                }
              }
            } else {
              currentTarget.push(child);
            }
          }

          const consequent = childrenToExpression(ifChildren);
          const alternate = childrenToExpression(elseChildren);
          const ternary = t.conditionalExpression(condition, consequent, alternate);

          path.replaceWith(ternary);
          return;
        }

        // 2. Transform <Choose>
        if (tagName === 'Choose') {
          const whenBranches = [];
          let otherwiseBranch = null;

          for (const child of path.node.children) {
            if (t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)) continue;

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

          for (let i = whenBranches.length - 1; i >= 0; i--) {
            const branch = whenBranches[i];
            result = t.conditionalExpression(branch.condition, branch.consequent, result);
          }

          path.replaceWith(result);
          return;
        }

        // 3. Transform standalone <When>
        if (tagName === 'When') {
          if (!path.parentPath || !isTag(path.parentPath.node, 'Choose')) {
            const condition = getConditionExpression(path.node);
            const consequent = childrenToExpression(path.node.children);
            const ternary = t.conditionalExpression(condition, consequent, t.nullLiteral());
            path.replaceWith(ternary);
            return;
          }
        }
      },
    },
  };
};
