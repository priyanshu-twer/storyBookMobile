/**
 * Babel Plugin: JSX Control Flow
 * Exact drop-in replacement for `babel-plugin-jsx-control-statements` (https://github.com/AlexGilleran/jsx-control-statements)
 * Dual compatible with Babel v7 and Babel v8.
 */

module.exports = function jcsPlugin(babel) {
  var types = babel.types;

  // ---------------------------------------------------------------------------
  // AST Utilities
  // ---------------------------------------------------------------------------
  var astUtil = {
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
      var key = astUtil.getAttributeMap(node).key;
      return key && key.value ? key.value.value : undefined;
    },

    getChildren: function (babelTypes, node) {
      return babelTypes.react.buildChildren(node);
    },

    addKeyAttribute: function (babelTypes, node, keyValue) {
      var keyFound = false;

      if (node && node.openingElement && node.openingElement.attributes) {
        node.openingElement.attributes.forEach(function (attrib) {
          if (babelTypes.isJSXAttribute(attrib) && attrib.name.name === 'key') {
            keyFound = true;
          }
        });

        if (!keyFound) {
          var keyAttrib = (babelTypes.jsxAttribute || babelTypes.jSXAttribute)(
            (babelTypes.jsxIdentifier || babelTypes.jSXIdentifier)('key'),
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
        var firstBlock = blocks[0];

        if (keyPrefix && firstBlock && firstBlock.openingElement) {
          astUtil.addKeyAttribute(babelTypes, firstBlock, keyPrefix);
        }

        return firstBlock;
      }

      for (var i = 0; i < blocks.length; i++) {
        var thisBlock = blocks[i];
        if (babelTypes.isJSXElement(thisBlock)) {
          var key = keyPrefix ? keyPrefix + '-' + i : i;
          astUtil.addKeyAttribute(babelTypes, thisBlock, key);
        }
      }

      return babelTypes.arrayExpression(blocks);
    }
  };

  // ---------------------------------------------------------------------------
  // Condition Utilities
  // ---------------------------------------------------------------------------
  var conditionalUtil = {
    getConditionExpression: function (node) {
      var attrMap = astUtil.getAttributeMap(node);
      var condition = attrMap.condition || attrMap.test || attrMap.is;

      if (!condition) {
        return (types.booleanLiteral || types.BooleanLiteral)(true);
      }

      if (condition.value === null) {
        return (types.booleanLiteral || types.BooleanLiteral)(true);
      }

      if (astUtil.isExpressionContainer(condition)) {
        return astUtil.getExpression(condition);
      }

      if (astUtil.isStringLiteral(condition)) {
        return condition.value;
      }

      return (types.booleanLiteral || types.BooleanLiteral)(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Statement Transformers
  // ---------------------------------------------------------------------------
  function transformIf(node) {
    var ifBlock = [];
    var elseBlock = [];
    var currentBlock = ifBlock;
    var condition = conditionalUtil.getConditionExpression(node);
    var key = astUtil.getKey(node);
    var children = astUtil.getChildren(types, node);

    children.forEach(function (child) {
      if (astUtil.isTag(child, 'Else')) {
        currentBlock = elseBlock;
        if (child.children && child.children.length > 0) {
          var nested = astUtil.getChildren(types, child);
          nested.forEach(function (n) {
            currentBlock.push(n);
          });
        }
      } else {
        currentBlock.push(child);
      }
    });

    var ifContent = astUtil.getSanitizedExpressionForContent(types, ifBlock, key);
    var elseContent = astUtil.getSanitizedExpressionForContent(types, elseBlock, key);

    return (types.conditionalExpression || types.ConditionalExpression)(
      condition,
      ifContent,
      elseContent
    );
  }

  function transformChoose(node) {
    var children = astUtil.getChildren(types, node);
    var key = astUtil.getKey(node);
    var whenBlocks = [];
    var otherwiseBlock = (types.nullLiteral || types.NullLiteral)();

    children.forEach(function (child) {
      if (astUtil.isTag(child, 'When')) {
        var childNodes = astUtil.getChildren(types, child);
        whenBlocks.push({
          condition: conditionalUtil.getConditionExpression(child),
          children: astUtil.getSanitizedExpressionForContent(types, childNodes, key)
        });
      } else if (astUtil.isTag(child, 'Otherwise')) {
        var otherwiseNodes = astUtil.getChildren(types, child);
        otherwiseBlock = astUtil.getSanitizedExpressionForContent(types, otherwiseNodes, key);
      }
    });

    var ternaryExpression = otherwiseBlock;

    for (var i = whenBlocks.length - 1; i >= 0; i--) {
      ternaryExpression = (types.conditionalExpression || types.ConditionalExpression)(
        whenBlocks[i].condition,
        whenBlocks[i].children,
        ternaryExpression
      );
    }

    return ternaryExpression;
  }

  function transformWhen(node) {
    var key = astUtil.getKey(node);
    var childNodes = astUtil.getChildren(types, node);
    var condition = conditionalUtil.getConditionExpression(node);
    var children = astUtil.getSanitizedExpressionForContent(types, childNodes, key);
    var nullLit = (types.nullLiteral || types.NullLiteral)();

    return (types.conditionalExpression || types.ConditionalExpression)(
      condition,
      children,
      nullLit
    );
  }

  function transformFor(node) {
    var mapParams = [];
    var attributes = astUtil.getAttributeMap(node);
    var children = astUtil.getChildren(types, node);
    var returnExpression = astUtil.getSanitizedExpressionForContent(types, children);

    if (!attributes.of) {
      return returnExpression;
    }

    if (attributes.each && attributes.each.value) {
      mapParams.push(types.identifier(attributes.each.value.value));
    } else {
      mapParams.push(types.identifier('item'));
    }

    if (attributes.index && attributes.index.value) {
      mapParams.push(types.identifier(attributes.index.value.value));
    }

    var ofExpr = astUtil.isExpressionContainer(attributes.of)
      ? attributes.of.value.expression
      : attributes.of.value;

    return types.callExpression(
      types.memberExpression(ofExpr, types.identifier('map')),
      [
        types.functionExpression(
          null,
          mapParams,
          types.blockStatement([types.returnStatement(returnExpression)])
        ),
        types.identifier('this')
      ]
    );
  }

  function transformWith(node) {
    var params = [];
    var values = [];
    var key = astUtil.getKey(node);
    var attributes = astUtil.getAttributeMap(node);
    var children = astUtil.getChildren(types, node);

    Object.keys(attributes).forEach(function (attr) {
      params.push(types.identifier(attr));
      if (astUtil.isExpressionContainer(attributes[attr])) {
        values.push(attributes[attr].value.expression);
      } else {
        values.push(attributes[attr].value);
      }
    });

    return types.callExpression(
      types.memberExpression(
        types.functionExpression(
          null,
          params,
          types.blockStatement([
            types.returnStatement(
              astUtil.getSanitizedExpressionForContent(types, children, key)
            )
          ])
        ),
        types.identifier('call')
      ),
      values
    );
  }

  var nodeHandlers = {
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

        var nodeName = path.node.openingElement.name.name;
        var handler = nodeHandlers[nodeName];

        if (handler) {
          if (nodeName === 'When' && path.parentPath && path.parentPath.node && astUtil.isTag(path.parentPath.node, 'Choose')) {
            return;
          }

          path.replaceWith(handler(path.node, path.hub ? path.hub.file : undefined));
        }
      }
    }
  };
};
