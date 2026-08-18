/**
 * Babel Plugin: JSX Control Flow
 * Modernized version of `babel-plugin-jsx-control-statements` for Babel v7 and Babel v8.
 *
 * Implements:
 *   - <If condition={...}> ... <Else /> ... </If>
 *   - <If condition={...}> ... <Else> ... </Else> </If>
 *   - <Choose> <When condition={...}> ... </When> <Otherwise> ... </Otherwise> </Choose>
 *   - Standalone <When condition={...}> ... </When>
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
   * Helper: Test if a node is a JSX element with a specific tag name.
   */
  function isTag(node, tagName) {
    return t.isJSXElement(node) && getTagName(node) === tagName;
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
   * Helper: Uses Babel's built-in react.buildChildren to correctly normalize
   * JSX children (handling whitespace, strings, and expression containers).
   */
  function getChildren(node) {
    return t.react.buildChildren(node);
  }

  /**
   * Helper: Returns single expression, NullLiteral, or ArrayExpression
   * (matching original jsx-control-statements getSanitizedExpressionForContent).
   */
  function getSanitizedExpressionForContent(blocks) {
    if (!blocks || !blocks.length) {
      return t.nullLiteral();
    }
    if (blocks.length === 1) {
      return blocks[0];
    }
    return t.arrayExpression(blocks);
  }

  /**
   * Transforms <If condition={...}> ... <Else> ... </Else> </If>
   */
  function transformIf(node) {
    const children = getChildren(node);
    const ifBlock = [];
    const elseBlock = [];
    let currentBlock = ifBlock;

    children.forEach((child) => {
      if (isTag(child, 'Else')) {
        currentBlock = elseBlock;
        if (child.children && child.children.length > 0) {
          const nested = getChildren(child);
          nested.forEach((n) => currentBlock.push(n));
        }
      } else {
        currentBlock.push(child);
      }
    });

    const condition = getConditionExpression(node);
    const consequent = getSanitizedExpressionForContent(ifBlock);
    const alternate = getSanitizedExpressionForContent(elseBlock);

    return t.conditionalExpression(condition, consequent, alternate);
  }

  /**
   * Transforms <Choose> <When condition={...}> ... </When> <Otherwise> ... </Otherwise> </Choose>
   */
  function transformChoose(node) {
    const children = getChildren(node);
    const whenBlocks = [];
    let otherwiseBlock = t.nullLiteral();

    children.forEach((child) => {
      if (isTag(child, 'When')) {
        const childNodes = getChildren(child);
        whenBlocks.push({
          condition: getConditionExpression(child),
          children: getSanitizedExpressionForContent(childNodes),
        });
      } else if (isTag(child, 'Otherwise')) {
        const childNodes = getChildren(child);
        otherwiseBlock = getSanitizedExpressionForContent(childNodes);
      }
    });

    let result = otherwiseBlock;
    for (let i = whenBlocks.length - 1; i >= 0; i--) {
      result = t.conditionalExpression(
        whenBlocks[i].condition,
        whenBlocks[i].children,
        result
      );
    }
    return result;
  }

  /**
   * Transforms standalone <When condition={...}> ... </When>
   */
  function transformWhen(node) {
    const childNodes = getChildren(node);
    return t.conditionalExpression(
      getConditionExpression(node),
      getSanitizedExpressionForContent(childNodes),
      t.nullLiteral()
    );
  }

  return {
    name: 'jsx-control-flow',
    visitor: {
      JSXElement(path) {
        const name = getTagName(path.node);
        let replacement = null;

        if (name === 'If') {
          replacement = transformIf(path.node);
        } else if (name === 'Choose') {
          replacement = transformChoose(path.node);
        } else if (name === 'When') {
          // Only transform standalone When (when not inside Choose)
          if (!path.parentPath || getTagName(path.parentPath.node) !== 'Choose') {
            replacement = transformWhen(path.node);
          }
        }

        if (replacement) {
          if (t.isJSXElement(path.parent) || t.isJSXFragment(path.parent)) {
            path.replaceWith(t.jsxExpressionContainer(replacement));
          } else {
            path.replaceWith(replacement);
          }
        }
      },
    },
  };
};
