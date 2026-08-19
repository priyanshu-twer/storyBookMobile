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
module.exports = function jsxControlFlowPlugin({ types: t }) {
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
    // 1. If child is inside curly braces {value} -> unwrap the inner expression
    if (t.isJSXExpressionContainer(child)) {
      return child.expression;
    }

    // 2. If child is plain text "Hello" -> convert into a JavaScript string literal
    if (t.isJSXText(child)) {
      return t.stringLiteral(child.value);
    }

    // 3. If child is a JSX tag <View /> or Fragment <>...</> -> return it directly
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

    // 1 child -> return it directly (e.g. <If condition={ok}><Text>A</Text></If> -> <Text>A</Text>)
    if (cleanChildren.length === 1) {
      return childToExpression(cleanChildren[0]);
    }

    // 2+ children -> wrap in an array (e.g. <If condition={ok}><Text>A</Text><Text>B</Text></If> -> [<Text>A</Text>, <Text>B</Text>])
    return t.arrayExpression(cleanChildren.map(childToExpression));
  }

  return {
    name: 'jsx-control-flow',
    visitor: {
      JSXElement(path) {
        const tagName = getTagName(path.node);

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
        } else if (tagName === 'Choose') {
          // =========================================================================
          // 2. Transform <Choose> <When condition={...}>...</When> <Otherwise>...</Otherwise> </Choose>
          //    Output: cond1 ? res1 : (cond2 ? res2 : otherwise)
          // =========================================================================
          const whenBranches = [];
          let otherwiseBranch = null;

          // 1. Loop through all children inside <Choose> to collect <When> and <Otherwise> tags
          path.node.children.forEach(child => {
            // Skip empty whitespace lines or non-JSX nodes
            if (isIgnorableWhitespace(child) || !t.isJSXElement(child)) {
              return;
            }

            const childTag = getTagName(child);

            // If it's <When condition={...}> -> extract its condition and its children
            if (childTag === 'When') {
              whenBranches.push({
                condition: getConditionExpression(child),
                consequent: childrenToExpression(child.children),
              });
            }
            // If it's <Otherwise> -> extract its fallback children
            else if (childTag === 'Otherwise') {
              otherwiseBranch = childrenToExpression(child.children);
            }
          });

          // 2. Base case: Use the <Otherwise> fallback, or default to `null` if omitted
          const initialFallback = otherwiseBranch || t.nullLiteral();

          // 3. Build nested ternary chain from right-to-left (bottom to top):
          //    when1 ? res1 : (when2 ? res2 : fallback)
          const result = whenBranches.reduceRight(
            (acc, { condition, consequent }) =>
              t.conditionalExpression(condition, consequent, acc),
            initialFallback,
          );

          // 4. Replace the <Choose> tag with the nested ternary chain
          path.replaceWith(result);
        } else if (tagName === 'When') {
          // =========================================================================
          // 3. Transform standalone <When condition={...}>...</When> (outside <Choose>)
          //    Output: condition ? consequent : null
          // =========================================================================
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
          }
        }
      },
    },
  };
};
