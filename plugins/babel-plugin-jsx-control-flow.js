/**
 * Babel Plugin: JSX Control Flow
 * Modernized version of `babel-plugin-jsx-control-statements` for Babel v7 and Babel v8.
 *
 * Implements:
 *   - <If condition={...}> ... <Else /> ... </If>
 *   - <If condition={...}> ... <Else> ... </Else> </If>
 *   - <Choose> <When condition={...}> ... </When> <Otherwise> ... </Otherwise> </Choose>
 *   - <When condition={...}> ... </When> (standalone)
 *   - <For each="item" of={items} index="idx"> ... </For>
 *   - <With a={1} b={2}> ... </With>
 */

module.exports = function jcsPlugin({ types: t }) {
  // ---------------------------------------------------------------------------
  // AST Utilities
  // ---------------------------------------------------------------------------
  const astUtil = {
    isTag: function (node, tagName) {
      return (
        node &&
        node.type === 'JSXElement' &&
        node.openingElement &&
        node.openingElement.name &&
        node.openingElement.name.name === tagName
      );
    },

    isExpressionContainer: function (attribute) {
      return (
        attribute &&
        attribute.value &&
        attribute.value.type === 'JSXExpressionContainer'
      );
    },

    getExpression: function (attribute) {
      return attribute.value.expression;
    },

    isStringLiteral: function (attribute) {
      return (
        attribute &&
        attribute.value &&
        attribute.value.type === 'StringLiteral'
      );
    },

    getAttributeMap: function (node) {
      if (!node || !node.openingElement || !node.openingElement.attributes) {
        return {};
      }
      return node.openingElement.attributes.reduce(function (result, attr) {
        if (attr && attr.name && attr.name.name) {
          result[attr.name.name] = attr;
        }
        return result;
      }, {});
    },

    getKey: function (node) {
      const key = astUtil.getAttributeMap(node).key;
      return key && key.value ? key.value.value : undefined;
    },

    getChildren: function (babelTypes, node) {
      return babelTypes.react.buildChildren(node);
    },

    addKeyAttribute: function (babelTypes, node, keyValue) {
      let keyFound = false;

      if (node && node.openingElement && node.openingElement.attributes) {
        node.openingElement.attributes.forEach(function (attrib) {
          if (babelTypes.isJSXAttribute(attrib) && attrib.name.name === 'key') {
            keyFound = true;
          }
        });

        if (!keyFound) {
          const keyAttrib = babelTypes.jsxAttribute(
            babelTypes.jsxIdentifier('key'),
            babelTypes.stringLiteral('' + keyValue)
          );
          node.openingElement.attributes.push(keyAttrib);
        }
      }
    },

    getSanitizedExpressionForContent: function (babelTypes, blocks, keyPrefix) {
      if (!blocks || !blocks.length) {
        return babelTypes.nullLiteral ? babelTypes.nullLiteral() : babelTypes.NullLiteral();
      } else if (blocks.length === 1) {
        const firstBlock = blocks[0];

        if (keyPrefix && firstBlock && firstBlock.openingElement) {
          astUtil.addKeyAttribute(babelTypes, firstBlock, keyPrefix);
        }

        return firstBlock;
      }

      for (let i = 0; i < blocks.length; i++) {
        const thisBlock = blocks[i];
        if (babelTypes.isJSXElement(thisBlock)) {
          const key = keyPrefix ? keyPrefix + '-' + i : i;
          astUtil.addKeyAttribute(babelTypes, thisBlock, key);
        }
      }

      return babelTypes.arrayExpression(blocks);
    }
  };

  // ---------------------------------------------------------------------------
  // Condition Utilities
  // ---------------------------------------------------------------------------
  const conditionalUtil = {
    getConditionExpression: function (node) {
      const attrMap = astUtil.getAttributeMap(node);
      let condition = attrMap.condition || attrMap.test || attrMap.is;

      if (!condition) {
        const attrs = Object.keys(attrMap);
        if (attrs.length > 0) {
          const firstAttrName = attrs[0];
          const firstAttr = attrMap[firstAttrName];
          if (firstAttr.value === null) {
            return t.identifier(firstAttrName);
          }
          condition = firstAttr;
        }
      }

      if (!condition) {
        return t.booleanLiteral ? t.booleanLiteral(true) : t.BooleanLiteral(true);
      }

      if (condition.value === null) {
        return t.identifier(condition.name.name);
      }

      if (astUtil.isExpressionContainer(condition)) {
        if (t.isJSXEmptyExpression(condition.value.expression)) {
          return t.booleanLiteral ? t.booleanLiteral(true) : t.BooleanLiteral(true);
        }
        return astUtil.getExpression(condition);
      }

      if (astUtil.isStringLiteral(condition)) {
        return condition.value;
      }

      return t.booleanLiteral ? t.booleanLiteral(true) : t.BooleanLiteral(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Transformers
  // ---------------------------------------------------------------------------
  function transformIf(node) {
    const ifBlock = [];
    const elseBlock = [];
    let currentBlock = ifBlock;
    const condition = conditionalUtil.getConditionExpression(node);
    const key = astUtil.getKey(node);
    const children = astUtil.getChildren(t, node);

    children.forEach(function (child) {
      if (astUtil.isTag(child, 'Else')) {
        currentBlock = elseBlock;
        if (child.children && child.children.length > 0) {
          const nested = astUtil.getChildren(t, child);
          nested.forEach(function (n) {
            currentBlock.push(n);
          });
        }
      } else {
        currentBlock.push(child);
      }
    });

    const ifContent = astUtil.getSanitizedExpressionForContent(t, ifBlock, key);
    const elseContent = astUtil.getSanitizedExpressionForContent(t, elseBlock, key);

    return (t.conditionalExpression || t.ConditionalExpression)(
      condition,
      ifContent,
      elseContent
    );
  }

  function transformChoose(node) {
    const children = astUtil.getChildren(t, node);
    const key = astUtil.getKey(node);
    const whenBlocks = [];
    let otherwiseBlock = t.nullLiteral ? t.nullLiteral() : t.NullLiteral();

    children.forEach(function (child) {
      if (astUtil.isTag(child, 'When')) {
        const childNodes = astUtil.getChildren(t, child);
        whenBlocks.push({
          condition: conditionalUtil.getConditionExpression(child),
          children: astUtil.getSanitizedExpressionForContent(t, childNodes, key)
        });
      } else if (astUtil.isTag(child, 'Otherwise')) {
        const otherwiseNodes = astUtil.getChildren(t, child);
        otherwiseBlock = astUtil.getSanitizedExpressionForContent(t, otherwiseNodes, key);
      }
    });

    let ternaryExpression = otherwiseBlock;

    for (let i = whenBlocks.length - 1; i >= 0; i--) {
      ternaryExpression = (t.conditionalExpression || t.ConditionalExpression)(
        whenBlocks[i].condition,
        whenBlocks[i].children,
        ternaryExpression
      );
    }

    return ternaryExpression;
  }

  function transformWhen(node) {
    const key = astUtil.getKey(node);
    const childNodes = astUtil.getChildren(t, node);
    const condition = conditionalUtil.getConditionExpression(node);
    const children = astUtil.getSanitizedExpressionForContent(t, childNodes, key);
    const nullLit = t.nullLiteral ? t.nullLiteral() : t.NullLiteral();

    return (t.conditionalExpression || t.ConditionalExpression)(
      condition,
      children,
      nullLit
    );
  }

  function transformFor(node) {
    const mapParams = [];
    const attributes = astUtil.getAttributeMap(node);
    const children = astUtil.getChildren(t, node);
    const returnExpression = astUtil.getSanitizedExpressionForContent(t, children);

    if (!attributes.of) {
      return returnExpression;
    }

    if (attributes.each && attributes.each.value) {
      mapParams.push(t.identifier(attributes.each.value.value));
    } else {
      mapParams.push(t.identifier('item'));
    }

    if (attributes.index && attributes.index.value) {
      mapParams.push(t.identifier(attributes.index.value.value));
    }

    const ofExpr = astUtil.isExpressionContainer(attributes.of)
      ? attributes.of.value.expression
      : attributes.of.value;

    return t.callExpression(
      t.memberExpression(ofExpr, t.identifier('map')),
      [
        t.arrowFunctionExpression(
          mapParams,
          returnExpression
        )
      ]
    );
  }

  function transformWith(node) {
    const params = [];
    const values = [];
    const key = astUtil.getKey(node);
    const attributes = astUtil.getAttributeMap(node);
    const children = astUtil.getChildren(t, node);

    Object.keys(attributes).forEach(function (attr) {
      params.push(t.identifier(attr));
      if (astUtil.isExpressionContainer(attributes[attr])) {
        values.push(attributes[attr].value.expression);
      } else {
        values.push(attributes[attr].value);
      }
    });

    return t.callExpression(
      t.arrowFunctionExpression(
        params,
        astUtil.getSanitizedExpressionForContent(t, children, key)
      ),
      values
    );
  }

  const handlers = {
    If: transformIf,
    Choose: transformChoose,
    When: transformWhen,
    For: transformFor,
    With: transformWith
  };

  return {
    name: 'jsx-control-flow',
    visitor: {
      JSXElement: function (path) {
        if (!path.node || !path.node.openingElement || !path.node.openingElement.name) {
          return;
        }

        const nodeName = path.node.openingElement.name.name;
        const handler = handlers[nodeName];

        if (handler) {
          // If When is inside Choose, transformChoose handles it
          if (nodeName === 'When' && path.parentPath && path.parentPath.node && astUtil.isTag(path.parentPath.node, 'Choose')) {
            return;
          }

          const replacement = handler(path.node);

          if (replacement) {
            if (t.isJSXElement(path.parent) || t.isJSXFragment(path.parent)) {
              path.replaceWith(t.jsxExpressionContainer(replacement));
            } else {
              path.replaceWith(replacement);
            }
          }
        }
      }
    }
  };
};
