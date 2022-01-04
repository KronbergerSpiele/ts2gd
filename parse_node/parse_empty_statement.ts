import ts, { SyntaxKind } from "typescript"

import { ParseNodeType, ParseState, combine } from "../parse_node"
import { Test } from "../tests/test"

export const parseEmptyStatement = (
  node: ts.EmptyStatement,
  props: ParseState
): ParseNodeType => {
  if (
    node.parent.kind === SyntaxKind.WhileStatement ||
    node.parent.kind === SyntaxKind.ForInStatement ||
    node.parent.kind === SyntaxKind.ForOfStatement ||
    // Exclude for statement on purpose because we always add in the increment. Well, almost always...!
    // node.parent.kind === SyntaxKind.ForStatement ||
    node.parent.kind === SyntaxKind.DoStatement
  ) {
    return combine({
      parent: node,
      nodes: [],
      parsedStrings: () => "pass",
      props,
    })
  }

  return combine({
    parent: node,
    nodes: [],
    parsedStrings: () => "",
    props,
  })
}

export const testPass1: Test = {
  ts: `
for (let x = 0; x < 10; x++);
  `,
  expected: `
var x: int = 0
while x < 10:
  x += 1
  `,
}

export const testPassForIn: Test = {
  ts: `
for (let x in {});
  `,
  expected: `
for x in {}:
  pass
`,
}

// export const testPassDoWhile: Test = {
//   ts: `
// do {

// } while(true);
//   `,
//   expected: `
// for x in {}:
//   pass
// `,
// };
