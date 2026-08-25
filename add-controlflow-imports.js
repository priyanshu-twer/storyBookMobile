/**
 * JSCodeshift transform: Add / sync imports from 'controlflow'
 *
 * Adds named imports for `If`, `When`, `Choose`, and `Otherwise` from 'controlflow'
 * based on which JSX control flow elements are actually used in the file.
 *
 * Usage:
 *   npx jscodeshift -t ./add-controlflow-imports.js <path-to-files> --parser=tsx
 */

const CONTROL_FLOW_TAGS = ['If', 'Choose', 'When', 'Otherwise'];
const CONTROL_FLOW_SET = new Set(CONTROL_FLOW_TAGS);

module.exports = function transformer(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  const moduleName = (options && options.moduleName) || 'controlflow';

  // 1. Detect which control flow tags are used in JSX
  const usedTags = new Set();

  root.find(j.JSXOpeningElement).forEach((path) => {
    const nameNode = path.node.name;
    if (
      nameNode &&
      nameNode.type === 'JSXIdentifier' &&
      CONTROL_FLOW_SET.has(nameNode.name)
    ) {
      usedTags.add(nameNode.name);
    }
  });

  // 2. Check for existing import(s) from the target module
  const existingImports = root.find(j.ImportDeclaration, {
    source: { value: moduleName },
  });

  let hasChanged = false;

  if (existingImports.length > 0) {
    // Collect non-controlflow specifiers from existing imports
    const preservedSpecifiers = [];
    const currentControlFlowSpecifiers = new Set();

    existingImports.forEach((path) => {
      (path.node.specifiers || []).forEach((specifier) => {
        if (specifier.type === 'ImportSpecifier') {
          const importedName = specifier.imported.name;
          if (CONTROL_FLOW_SET.has(importedName)) {
            currentControlFlowSpecifiers.add(importedName);
          } else {
            preservedSpecifiers.push(specifier);
          }
        } else {
          // Default or namespace imports if any
          preservedSpecifiers.push(specifier);
        }
      });
    });

    // Check if the controlflow specifiers already match exactly what's used
    const tagsToAddOrKeep = Array.from(usedTags).sort();
    const currentTags = Array.from(currentControlFlowSpecifiers).sort();

    const tagsMatch =
      tagsToAddOrKeep.length === currentTags.length &&
      tagsToAddOrKeep.every((tag, idx) => tag === currentTags[idx]);

    if (!tagsMatch) {
      hasChanged = true;
    }

    const allNewSpecifiers = [
      ...preservedSpecifiers,
      ...tagsToAddOrKeep.map((tag) => j.importSpecifier(j.identifier(tag))),
    ];

    if (allNewSpecifiers.length === 0) {
      // If no specifiers are left, remove the import declaration(s)
      existingImports.remove();
      hasChanged = true;
    } else {
      // Update the first import declaration and remove any duplicate imports
      const primaryImport = existingImports.at(0);
      primaryImport.get('specifiers').replace(allNewSpecifiers);

      if (existingImports.length > 1) {
        existingImports.forEach((path, index) => {
          if (index > 0) {
            j(path).remove();
            hasChanged = true;
          }
        });
      }
    }
  } else if (usedTags.size > 0) {
    // 3. No existing import found, but control flow tags are used -> create new import
    const sortedTags = Array.from(usedTags).sort();
    const specifiers = sortedTags.map((tag) =>
      j.importSpecifier(j.identifier(tag)),
    );
    const newImport = j.importDeclaration(specifiers, j.literal(moduleName));

    const allImports = root.find(j.ImportDeclaration);

    if (allImports.length > 0) {
      // Insert after the last existing import statement
      allImports.at(-1).insertAfter(newImport);
    } else {
      // Insert at the beginning of the program
      const program = root.find(j.Program).get();
      if (program.node.body.length > 0) {
        // Check if the first node has leading comments
        const firstNode = program.node.body[0];
        if (firstNode.comments) {
          newImport.comments = firstNode.comments;
          firstNode.comments = null;
        }
        program.node.body.unshift(newImport);
      } else {
        program.node.body.push(newImport);
      }
    }

    hasChanged = true;
  }

  if (!hasChanged) {
    return null;
  }

  const printOptions = (options && options.printOptions) || {
    quote: 'single',
    trailingComma: true,
  };

  return root.toSource(printOptions);
};

// Default parser for jscodeshift CLI (handles TS, TSX, JS, JSX)
module.exports.parser = 'tsx';
