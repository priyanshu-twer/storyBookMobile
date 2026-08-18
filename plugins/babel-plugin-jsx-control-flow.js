/**
 * Babel Plugin: JSX Control Flow
 * 
 * Provides compile-time transformation for:
 *   - <If condition={...}> ... <Else> ... </Else> </If>
 *   - <Choose> <When condition={...}> ... </When> <Otherwise> ... </Otherwise> </Choose>
 *   - Standalone <When condition={...}> ... </When>
 *   - Standalone <Otherwise> ... </Otherwise>
 *   - Standalone <Else> ... </Else>
 *
 * Compatible with Babel v7 and Babel v8.
 */
module.exports = function ({ types: t }) {
  /**
   * Extracts the tag name from a JSXElement if it's a simple identifier.
   * e.g., <If> -> "If", <Choose> -> "Choose"
   */
  function getTagName(node) {
    if (t.isJSXElement(node) && t.isJSXIdentifier(node.openingElement.name)) {
      return node.openingElement.name.name;
    }
    return null;
  }

  /**
   * Extracts the condition/test expression from element attributes.
   * Supports: condition={expr}, test={expr}, is={expr}, or boolean flag attribute <When condition />
   */
  function getConditionExpression(node) {
    const attr = node.openingElement.attributes.find(
      (a) =>
        t.isJSXAttribute(a) &&
        (a.name.name === 'condition' ||
          a.name.name === 'test' ||
          a.name.name === 'is')
    );

    // If no attribute found, default to true
    if (!attr) {
      return t.booleanLiteral(true);
    }

    // If attribute is a boolean flag with no value (e.g. <If condition />)
    if (attr.value === null) {
      return t.booleanLiteral(true);
    }

    // If attribute is an expression (e.g. condition={data !== null})
    if (t.isJSXExpressionContainer(attr.value)) {
      if (t.isJSXEmptyExpression(attr.value.expression)) {
        return t.booleanLiteral(true);
      }
      return attr.value.expression;
    }

    // If attribute is a string literal (e.g. condition="true")
    if (t.isStringLiteral(attr.value)) {
      return attr.value;
    }

    return t.booleanLiteral(true);
  }

  /**
   * Filters out pure indentation/newline whitespace while PRESERVING
   * inline whitespace (e.g. " " between tags) so text snapshot tests match exactly.
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

      // Filter out only formatting whitespace (newlines and indentation)
      if (t.isJSXText(child)) {
        // If it contains a newline and only whitespace, it is just formatting indentation
        if (/^\s*[\r\n]+\s*$/.test(child.value)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Converts an array of JSX children into a valid single JavaScript expression.
   * - 0 children -> null
   * - 1 child -> single element / expression / string
   * - >1 children -> wrapped in a JSX Fragment <>{...}</>
   */
  function childrenToExpression(children) {
    const cleanChildren = cleanJSXChildren(children);

    // Empty branch -> null
    if (cleanChildren.length === 0) {
      return t.nullLiteral();
    }

    // Single child -> return directly without extra fragment wrapper
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
    }

    // Multiple children -> wrap in a JSX Fragment <>{children}</>
    return t.jsxFragment(
      t.jsxOpeningFragment(),
      t.jsxClosingFragment(),
      cleanChildren
    );
  }

  /**
   * Replaces a JSXElement AST node with a JavaScript expression.
   * If the parent node is a JSX element or JSX fragment, the expression
   * must be wrapped in a JSXExpressionContainer: { expression }
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
      /**
       * Using exit visitor ensures all child elements are processed bottom-up,
       * allowing arbitrary nesting of <If>, <Choose>, <When>, etc.
       */
      JSXElement: {
        exit(path) {
          const tagName = getTagName(path.node);

          // -----------------------------------------------------------------
          // 1. Handle <If> statements
          // -----------------------------------------------------------------
          if (tagName === 'If') {
            const condition = getConditionExpression(path.node);
            const thenChildren = [];
            const elseChildren = [];

            for (const child of path.node.children) {
              // Ignore newline indentation between child tags
              if (t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)) {
                continue;
              }

              // Collect children inside <Else>...</Else>
              if (getTagName(child) === 'Else') {
                for (const elseChild of child.children) {
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

          // -----------------------------------------------------------------
          // 2. Handle <Choose> statements
          // -----------------------------------------------------------------
          if (tagName === 'Choose') {
            const whenBranches = [];
            let otherwiseBranch = null;

            for (const child of path.node.children) {
              // Ignore newline indentation between child tags
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

            // Default fallback if no When matches and no Otherwise is provided
            let result = otherwiseBranch || t.nullLiteral();

            // Build chained ternary from right to left: cond1 ? res1 : cond2 ? res2 : fallback
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
          // 3. Handle Standalone <When> statements (outside of <Choose>)
          // -----------------------------------------------------------------
          if (tagName === 'When') {
            const parentTag = getTagName(path.parent);
            // If inside a <Choose>, the Choose visitor handles it
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
          // 4. Handle Standalone <Otherwise> or <Else> (outside parent)
          // -----------------------------------------------------------------
          if (tagName === 'Otherwise' || tagName === 'Else') {
            const parentTag = getTagName(path.parent);
            // If inside <Choose> or <If>, parent handles it
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
