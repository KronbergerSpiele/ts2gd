import ts from "typescript"

import { ParseState, combine, ParseNodeType } from "../parse_node"
import { Test } from "../tests/test"

export const parseNumericLiteral = (
  node: ts.NumericLiteral,
  props: ParseState
): ParseNodeType => {
  // node.text has some weird edge cases e.g. "6.1" gives "6"!

  return combine({
    parent: node,
    nodes: [],
    props,
    parsedStrings: () => node.getText(),
  })
}

export const testInt: Test = {
  ts: `
let x = 1
  `,
  expected: `
var _x: int = 1
  `,
}

export const testFloat: Test = {
  ts: `
let x = 1.0
  `,
  expected: `
var _x: float = 1.0
  `,
}
