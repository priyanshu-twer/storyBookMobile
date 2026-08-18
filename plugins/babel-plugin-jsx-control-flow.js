/**
 * Babel Plugin: JSX Control Flow
 * Direct port of `babel-plugin-jsx-control-statements` (https://github.com/AlexGilleran/jsx-control-statements)
 * Updated for Babel v7 & Babel v8 compatibility.
 */

module.exports = function jcsPlugin(babel) {
  var types = babel.types;

  // ---------------------------------------------------------------------------
  // astUtil
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
          var keyAttrib = babelTypes.jsxAttribute(
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
  // conditionalUtil
  // ---------------------------------------------------------------------------
  var conditionalUtil = {
    getConditionExpression: function (node) {
      var attrMap = astUtil.getAttributeMap(node);
      var condition = attrMap.condition || attrMap.test || attrMap.is;

      // If no explicit condition/test/is attribute, check for boolean prop like <If isVertical />
      if (!condition) {
        var attrs = Object.keys(attrMap);
        if (attrs.length > 0) {
          var firstAttrName = attrs[0];
          var firstAttr = attrMap[firstAttrName];
          if (firstAttr.value === null) {
            return types.identifier(firstAttrName);
          }
          condition = firstAttr;
        }
      }

      if (!condition) {
        return types.booleanLiteral ? types.booleanLiteral(true) : types.BooleanLiteral(true);
      }

      if (condition.value === null) {
        return types.identifier(condition.name.name);
      }

      if (astUtil.isExpressionContainer(condition)) {
        if (types.isJSXEmptyExpression(condition.value.expression)) {
          return types.booleanLiteral ? types.booleanLiteral(true) : types.BooleanLiteral(true);
        }
        return astUtil.getExpression(condition);
      }

      if (astUtil.isStringLiteral(condition)) {
        return condition.value;
      }

      return types.booleanLiteral ? types.booleanLiteral(true) : types.BooleanLiteral(true);
    }
  };

  // ---------------------------------------------------------------------------
  // transformIf
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

  // ---------------------------------------------------------------------------
  // transformChoose
  // ---------------------------------------------------------------------------
  function transformChoose(node) {
    var children = astUtil.getChildren(types, node);
    var key = astUtil.getKey(node);
    var whenBranches = [];
    var otherwiseBlock = types.nullLiteral ? types.nullLiteral() : types.NullLiteral();

    children.forEach(function (child) {
      if (astUtil.isTag(child, 'When')) {
        var childNodes = astUtil.getChildren(types, child);
        whenBranches.push({
          condition: conditionalUtil.getConditionExpression(child),
          children: astUtil.getSanitizedExpressionForContent(types, childNodes, key)
        });
      } else if (astUtil.isTag(child, 'Otherwise')) {
        var otherwiseNodes = astUtil.getChildren(types, child);
        otherwiseBlock = astUtil.getSanitizedExpressionForContent(types, otherwiseNodes, key);
      }
    });

    var ternaryExpression = otherwiseBlock;

    for (var i = whenBranches.length - 1; i >= 0; i--) {
      ternaryExpression = (types.conditionalExpression || types.ConditionalExpression)(
        whenBranches[i].condition,
        whenBranches[i].children,
        ternaryExpression
      );
    }

    return ternaryExpression;
  }

  // ---------------------------------------------------------------------------
  // transformWhen (Standalone)
  // ---------------------------------------------------------------------------
  function transformWhen(node) {
    var key = astUtil.getKey(node);
    var childNodes = astUtil.getChildren(types, node);
    var condition = conditionalUtil.getConditionExpression(node);
    var children = astUtil.getSanitizedExpressionForContent(types, childNodes, key);
    var nullLit = types.nullLiteral ? types.nullLiteral() : types.NullLiteral();

    return (types.conditionalExpression || types.ConditionalExpression)(
      condition,
      children,
      nullLit
    );
  }

  // ---------------------------------------------------------------------------
  // Plugin Visitor
  // ---------------------------------------------------------------------------
  var nodeHandlers = {
    If: transformIf,
    Choose: transformChoose
  };

  return {
    visitor: {
      JSXElement: function (path) {
        if (!path.node || !path.node.openingElement || !path.node.openingElement.name) {
          return;
        }

        var nodeName = path.node.openingElement.name.name;
        var handler = nodeHandlers[nodeName];
        var replacement = null;

        if (handler) {
          replacement = handler(path.node);
        } else if (nodeName === 'When') {
          if (!path.parentPath || !path.parentPath.node || !astUtil.isTag(path.parentPath.node, 'Choose')) {
            replacement = transformWhen(path.node);
          }
        }

        if (replacement) {
          if (types.isJSXElement(path.parent) || types.isJSXFragment(path.parent)) {
            path.replaceWith(types.jsxExpressionContainer(replacement));
          } else {
            path.replaceWith(replacement);
          }
        }
      }
    }
  };
};
