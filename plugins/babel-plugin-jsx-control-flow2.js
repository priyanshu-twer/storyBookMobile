/**
 * Babel Plugin: jsx-control-flow
 *
 * Transforms declarative JSX control flow tags (<If>, <Choose>, <When>, <Otherwise>)
 * into standard JavaScript ternary expressions at compile time.
 *
 * Example:
 *   <If condition={isLoggedIn}> <User /> </If>
 * becomes:
 *   isLoggedIn ? <User /> : null
 */
module.exports = function ({ types: t }) {
  // Pre-compiled regex to filter out formatting-only whitespace and newlines
  const FORMATTING_WHITESPACE_REGEX = /^\s*[\r\n]+\s*$/;

  /**
   * Returns true if a child node is pure formatting whitespace (newlines/indentation).
   */
  function isIgnorableWhitespace(node) {
    return t.isJSXText(node) && FORMATTING_WHITESPACE_REGEX.test(node.value);
  }

  /**
   * Returns the tag name of a JSX element (e.g. "If", "Choose"), or null if invalid.
   */
  function getTagName(node) {
    if (
      node &&
      t.isJSXElement(node) &&
      t.isJSXIdentifier(node.openingElement.name)
    ) {
      return node.openingElement.name.name;
    }
    return null;
  }

  /**
   * Checks whether a node is a JSX element matching a specific tag name.
   */
  function isTag(node, tagName) {
    return t.isJSXElement(node) && getTagName(node) === tagName;
  }

  /**
   * Extracts the condition expression from the `condition` attribute.
   * Defaults to boolean literal `true` if omitted, empty, or passed as a flag.
   */
  function getConditionExpression(node) {
    // Find the `condition` attribute
    const attr = node.openingElement.attributes.find(
      a => t.isJSXAttribute(a) && a.name.name === 'condition',
    );

    // Flag shorthand without value (e.g. <If condition>) -> true
    if (!attr || attr.value === null) {
      return t.booleanLiteral(true);
    }

    // JSX expression container: condition={isReady} or condition={}
    if (t.isJSXExpressionContainer(attr.value)) {
      // Empty container (e.g. condition={}) -> true
      if (t.isJSXEmptyExpression(attr.value.expression)) {
        return t.booleanLiteral(true);
      }
      return attr.value.expression;
    }

    // String literal: condition="active"
    if (t.isStringLiteral(attr.value)) {
      return attr.value;
    }

    return t.booleanLiteral(true);
  }

  /**
   * Converts a single JSX child node into an AST expression.
   */
  function childToExpression(child) {
    if (t.isJSXExpressionContainer(child)) {
      return child.expression;
    }
    if (t.isJSXText(child)) {
      return t.stringLiteral(child.value);
    }
    return child;
  }

  /**
   * Converts JSX children into a single AST expression:
   * - 0 children  -> null
   * - 1 child     -> expression directly
   * - 2+ children -> array expression [child1, child2]
   */
  function childrenToExpression(children) {
    // Remove formatting whitespace
    const cleanChildren = children.filter(
      child => !isIgnorableWhitespace(child),
    );

    // No children -> null
    if (cleanChildren.length === 0) {
      return t.nullLiteral();
    }

    if (cleanChildren.length === 1) {
      return childToExpression(cleanChildren[0]);
    }

    return t.arrayExpression(cleanChildren.map(childToExpression));
  }

  return {
    name: 'jsx-control-flow',
    visitor: {
      JSXElement(path) {
        const tagName = getTagName(path.node);

        // Fast-path: Ignore all non-control-flow tags
        if (tagName !== 'If' && tagName !== 'Choose' && tagName !== 'When') {
          return;
        }

        // =========================================================================
        // 1. Transform <If condition={...}>...</If>
        //    Output: condition ? consequent : null
        // =========================================================================
        if (tagName === 'If') {
          const condition = getConditionExpression(path.node);
          const consequent = childrenToExpression(path.node.children);
          const ternary = t.conditionalExpression(
            condition,
            consequent,
            t.nullLiteral(),
          );

          path.replaceWith(ternary);
          return;
        }

        // =========================================================================
        // 2. Transform <Choose> <When condition={...}>...</When> <Otherwise>...</Otherwise> </Choose>
        //    Output: cond1 ? res1 : (cond2 ? res2 : otherwise)
        // =========================================================================
        if (tagName === 'Choose') {
          const whenBranches = [];
          let otherwiseBranch = null;

          // Parse children to extract <When> branches and fallback <Otherwise>
          for (const child of path.node.children) {
            if (isIgnorableWhitespace(child) || !t.isJSXElement(child)) {
              continue;
            }

            const childTag = getTagName(child);
            if (childTag === 'When') {
              whenBranches.push({
                condition: getConditionExpression(child),
                consequent: childrenToExpression(child.children),
              });
            } else if (childTag === 'Otherwise') {
              otherwiseBranch = childrenToExpression(child.children);
            }
          }

          // Build nested ternary chain from right-to-left
          let result = otherwiseBranch || t.nullLiteral();
          for (let i = whenBranches.length - 1; i >= 0; i--) {
            const { condition, consequent } = whenBranches[i];
            result = t.conditionalExpression(condition, consequent, result);
          }

          path.replaceWith(result);
          return;
        }

        // =========================================================================
        // 3. Transform standalone <When condition={...}>...</When> (outside <Choose>)
        //    Output: condition ? consequent : null
        // =========================================================================
        if (tagName === 'When') {
          // Transform only if not directly nested inside <Choose>
          if (!path.parentPath || !isTag(path.parentPath.node, 'Choose')) {
            const condition = getConditionExpression(path.node);
            const consequent = childrenToExpression(path.node.children);
            const ternary = t.conditionalExpression(
              condition,
              consequent,
              t.nullLiteral(),
            );

            path.replaceWith(ternary);
            return;
          }
        }
      },
    },
  };
};
