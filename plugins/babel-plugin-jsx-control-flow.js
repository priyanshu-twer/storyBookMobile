/**
 * Babel Plugin: JSX Control Flow
 * 
 * Provides compile-time transformation for:
 *   1. <If condition={...}> ... <Else> ... </Else> </If>
 *      and <If condition={...}> ... <Else /> ... </If>
 *   2. <Choose>
 *        <When condition={...}> ... </When>
 *        <Otherwise> ... </Otherwise>
 *      </Choose>
 *   3. Standalone <When condition={...}> ... </When>
 *   4. Standalone <Otherwise> ... </Otherwise>
 *   5. Standalone <Else> ... </Else>
 */
module.exports = function ({ types: t }) {
  /**
   * Helper: Get element tag name.
   */
  function getTagName(node) {
    if (t.isJSXElement(node) && t.isJSXIdentifier(node.openingElement.name)) {
      return node.openingElement.name.name;
    }
    return null;
  }

  /**
   * Helper: Extract condition expression from attributes.
   * Supports: condition={expr}, test={expr}, is={expr}, or boolean flag <When condition />
   */
  function getConditionExpression(node) {
    const attr = node.openingElement.attributes.find(
      (a) =>
        t.isJSXAttribute(a) &&
        (a.name.name === 'condition' ||
          a.name.name === 'test' ||
          a.name.name === 'is')
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
   * Helper: Filter out formatting whitespace newlines while preserving inline spacing.
   */
  function cleanJSXChildren(children) {
    return children.filter((child) => {
      // Filter out comments like {/* some comment */}
      if (
        t.isJSXExpressionContainer(child) &&
        t.isJSXEmptyExpression(child.expression)
      ) {
        return false;
      }
      // Filter out formatting newlines and indentation
      if (t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Helper: Ensure any node inside a JSXFragment is a valid JSX child.
   */
  function ensureJSXChild(child) {
    if (
      t.isJSXElement(child) ||
      t.isJSXFragment(child) ||
      t.isJSXText(child) ||
      t.isJSXExpressionContainer(child) ||
      t.isJSXSpreadChild(child)
    ) {
      return child;
    }
    return t.jsxExpressionContainer(child);
  }

  /**
   * Helper: Convert array of JSX children to a single JS expression.
   */
  function childrenToExpression(children) {
    const cleanChildren = cleanJSXChildren(children);

    if (cleanChildren.length === 0) {
      return t.nullLiteral();
    }

    if (cleanChildren.length === 1) {
      const child = cleanChildren[0];

      if (t.isJSXElement(child) || t.isJSXFragment(child)) {
        return child;
      }

      if (t.isJSXExpressionContainer(child)) {
        if (t.isJSXEmptyExpression(child.expression)) {
          return t.nullLiteral();
        }
        return child.expression;
      }

      if (t.isJSXText(child)) {
        return t.stringLiteral(child.value);
      }

      return child;
    }

    // Multiple children -> wrap in a JSX Fragment <>{children}</>
    return t.jsxFragment(
      t.jsxOpeningFragment(),
      t.jsxClosingFragment(),
      cleanChildren.map(ensureJSXChild)
    );
  }

  /**
   * Helper: Replace a JSX node with a JS expression, wrapping in `{ expr }` if inside JSX.
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
      JSXElement: {
        exit(path) {
          const tagName = getTagName(path.node);

          // -----------------------------------------------------------------
          // 1. <If condition={...}> ... <Else> ... </Else> </If>
          //    or <If condition={...}> ... <Else /> ... </If>
          // -----------------------------------------------------------------
          if (tagName === 'If') {
            const condition = getConditionExpression(path.node);
            const thenChildren = [];
            const elseChildren = [];
            let inElse = false;

            for (const child of path.node.children) {
              if (t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)) {
                continue;
              }

              if (getTagName(child) === 'Else') {
                inElse = true;
                // If <Else> wraps its children: <Else><B /></Else>
                if (child.children && child.children.length > 0) {
                  for (const elseChild of child.children) {
                    elseChildren.push(elseChild);
                  }
                }
              } else if (inElse) {
                // If <Else /> was used as a separator: <If><A /><Else /><B /></If>
                elseChildren.push(child);
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

          // -----------------------------------------------------------------
          // 2. <Choose> <When condition={...}> ... </When> <Otherwise> ... </Otherwise> </Choose>
          // -----------------------------------------------------------------
          if (tagName === 'Choose') {
            const whenBranches = [];
            let otherwiseBranch = null;

            for (const child of path.node.children) {
              if (t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)) {
                continue;
              }

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
              result = t.conditionalExpression(
                branch.condition,
                branch.consequent,
                result
              );
            }

            replaceWithExpression(path, result);
            return;
          }

          // -----------------------------------------------------------------
          // 3. Standalone <When condition={...}>
          // -----------------------------------------------------------------
          if (tagName === 'When') {
            const parentTag = getTagName(path.parent);
            if (parentTag === 'Choose') {
              return;
            }

            const condition = getConditionExpression(path.node);
            const consequent = childrenToExpression(path.node.children);
            const ternary = t.conditionalExpression(
              condition,
              consequent,
              t.nullLiteral()
            );

            replaceWithExpression(path, ternary);
            return;
          }

          // -----------------------------------------------------------------
          // 4. Standalone <Otherwise> or <Else>
          // -----------------------------------------------------------------
          if (tagName === 'Otherwise' || tagName === 'Else') {
            const parentTag = getTagName(path.parent);
            if (parentTag === 'Choose' || parentTag === 'If') {
              return;
            }

            const content = childrenToExpression(path.node.children);
            replaceWithExpression(path, content);
            return;
          }
        },
      },
    },
  };
};
