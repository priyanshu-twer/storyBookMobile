/**
 * Babel Plugin: JSX Control Flow
 * Exact 1-to-1 equivalent of `jsx-control-statements`
 *
 * Supported Statements:
 * 1. <If condition={test}>thenBlock</If>
 * 2. <If condition={test}>thenBlock<Else>elseBlock</Else></If>
 * 3. <Choose>
 *      <When condition={test1}>branch1</When>
 *      <When condition={test2}>branch2</When>
 *      <Otherwise>defaultBranch</Otherwise>
 *    </Choose>
 * 4. <When condition={test}>branch</When> (Standalone)
 * 5. <For each="item" of={items} index="i">body</For>
 * 6. <With foo={bar} baz={qux}>body</With>
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
   * Helper: Extract condition expression from attributes (supports condition, test, is, or boolean flag).
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
      if (
        t.isJSXExpressionContainer(child) &&
        t.isJSXEmptyExpression(child.expression)
      ) {
        return false;
      }
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

          // 1. <If>
          if (tagName === 'If') {
            const condition = getConditionExpression(path.node);
            const thenChildren = [];
            const elseChildren = [];

            for (const child of path.node.children) {
              if (t.isJSXText(child) && /^\s*[\r\n]+\s*$/.test(child.value)) {
                continue;
              }

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

          // 2. <Choose>
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

          // 3. Standalone <When>
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

          // 4. Standalone <Otherwise> or <Else>
          if (tagName === 'Otherwise' || tagName === 'Else') {
            const parentTag = getTagName(path.parent);
            if (parentTag === 'Choose' || parentTag === 'If') {
              return;
            }

            const content = childrenToExpression(path.node.children);
            replaceWithExpression(path, content);
            return;
          }

          // 5. <For each="item" of={items} index="i">
          if (tagName === 'For') {
            let eachParam = t.identifier('item');
            let ofArray = null;
            let indexParam = null;

            for (const attr of path.node.openingElement.attributes) {
              if (t.isJSXAttribute(attr)) {
                const name = attr.name.name;
                if (name === 'each') {
                  if (t.isStringLiteral(attr.value)) {
                    eachParam = t.identifier(attr.value.value);
                  } else if (
                    t.isJSXExpressionContainer(attr.value) &&
                    t.isIdentifier(attr.value.expression)
                  ) {
                    eachParam = attr.value.expression;
                  }
                } else if (name === 'of' || name === 'in') {
                  if (t.isJSXExpressionContainer(attr.value)) {
                    ofArray = attr.value.expression;
                  }
                } else if (name === 'index') {
                  if (t.isStringLiteral(attr.value)) {
                    indexParam = t.identifier(attr.value.value);
                  } else if (
                    t.isJSXExpressionContainer(attr.value) &&
                    t.isIdentifier(attr.value.expression)
                  ) {
                    indexParam = attr.value.expression;
                  }
                }
              }
            }

            if (!ofArray) {
              replaceWithExpression(path, t.nullLiteral());
              return;
            }

            const params = [eachParam];
            if (indexParam) {
              params.push(indexParam);
            }

            const body = childrenToExpression(path.node.children);
            const arrowFunc = t.arrowFunctionExpression(params, body);
            const mapCall = t.callExpression(
              t.memberExpression(
                t.logicalExpression('||', ofArray, t.arrayExpression([])),
                t.identifier('map')
              ),
              [arrowFunc]
            );

            replaceWithExpression(path, mapCall);
            return;
          }

          // 6. <With foo={bar} baz={qux}>
          if (tagName === 'With') {
            const params = [];
            const args = [];

            for (const attr of path.node.openingElement.attributes) {
              if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                params.push(t.identifier(attr.name.name));
                if (attr.value === null) {
                  args.push(t.booleanLiteral(true));
                } else if (t.isJSXExpressionContainer(attr.value)) {
                  args.push(attr.value.expression);
                } else if (t.isStringLiteral(attr.value)) {
                  args.push(attr.value);
                } else {
                  args.push(t.nullLiteral());
                }
              }
            }

            const body = childrenToExpression(path.node.children);
            const iife = t.callExpression(
              t.arrowFunctionExpression(params, body),
              args
            );

            replaceWithExpression(path, iife);
            return;
          }
        },
      },
    },
  };
};
