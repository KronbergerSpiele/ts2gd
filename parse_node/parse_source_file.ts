import ts, { ClassDeclaration, SyntaxKind } from "typescript"
import { addError, ErrorName } from "../errors"
import { combine, parseNode, ParseNodeType, ParseState } from "../parse_node"
import { Test } from "../tests/test"
import { LibraryFunctions } from "./library_functions"

type ParsedClassDeclaration = {
  fileName: string
  parsedClass: ParseNodeType
  classDecl: ts.ClassDeclaration | ts.ClassExpression
}

/**
 * The class_name and extends statements *must* come first in the file, so we
 * preprocess the class to find them prior to our normal pass.
 */
const getClassDeclarationHeader = (
  node: ts.ClassDeclaration | ts.ClassExpression,
  props: ParseState
) => {
  const modifiers = (node.modifiers ?? []).map((x) => x.getText())
  // TODO: Can be moved into parse_class_declaration i think

  let extendsFrom = ""

  if (node.heritageClauses) {
    // TODO: Ensure there's only one of each here

    const clause = node.heritageClauses[0] as ts.HeritageClause
    const type = clause.types[0]
    const tsType = props.program.getTypeChecker().getTypeAtLocation(type)

    extendsFrom = type.getText()

    if (tsType.symbol && tsType.symbol.declarations) {
      // Handle the case when extended class is a inner clas of file
      const classDecl = tsType.symbol.declarations.find((v) =>
        ts.isClassDeclaration(v)
      ) as ClassDeclaration | null

      if (classDecl) {
        const modifiers = (classDecl.modifiers ?? []).map((v) => v.getText())

        const asset = props.project
          .sourceFiles()
          .find((v) => v.fsPath === classDecl.getSourceFile().fileName)

        if (
          !asset &&
          !modifiers.includes("declare") &&
          (!modifiers.includes("default") || !classDecl.name)
        ) {
          addError({
            description:
              "Class extends a type for which a source file is missing. This is an internal ts2gd bug. Please report it.",
            error: ErrorName.ClassDoesntExtendAnything,
            location: node,
            stack: new Error().stack ?? "",
          })
        } else if (!modifiers.includes("default")) {
          // If a class declaration does not have default export then this is an inner class
          // The syntax for extending inner class in gdscript is: extends "res://compiled/Test.gd".BaseType
          extendsFrom = asset
            ? `"${asset.resPath}".${type.getText()}`
            : "[missing]"
        } else if (!classDecl.name) {
          // If a class declaration have default export and does not have a name then it is anonymous
          // The syntax for extending anonymous class in gdscript is: extends "res://compiled/Test.gd"
          extendsFrom = asset ? `"${asset.resPath}"` : "[missing]"
        }
      }
    }
  }

  const isTool = !!node.decorators?.find(
    (dec) => dec.expression.getText() === "tool"
  )

  if (modifiers.includes("default")) {
    return `${isTool ? "tool\n" : ""}${
      extendsFrom ? `extends ${extendsFrom}` : ""
    }
${props.isAutoload || !node.name ? "" : `class_name ${node.name.getText()}\n`}`
  }

  if (isTool) {
    addError({
      description: "Only class exported as default can be decorated as tool.",
      error: ErrorName.ClassMustBeExported,
      location: node,
      stack: new Error().stack ?? "",
    })
  }

  return `
class ${node.name?.getText()}${extendsFrom ? ` extends ${extendsFrom}` : ""}:`
}

export const getFileHeader = (): string => {
  return `# This file has been autogenerated by ts2gd. DO NOT EDIT!\n\n`
}

export const parseSourceFile = (
  node: ts.SourceFile,
  props: ParseState
): ParseNodeType => {
  const { statements } = node
  const sourceInfo = props.project
    .sourceFiles()
    .find((file) => file.fsPath === node.fileName)

  // props.usages = utils.collectVariableUsage(node)
  props.isAutoload = sourceInfo?.isAutoload() ?? false

  const allClasses = statements.filter(
    (statement) =>
      statement.kind === SyntaxKind.ClassDeclaration &&
      // skip class type declarations
      (statement.modifiers ?? []).filter((m) => m.getText() === "declare")
        .length === 0
  ) as ts.ClassDeclaration[]

  const parsedClassDeclarations: ParsedClassDeclaration[] = []
  let hoistedLibraryFunctionDefinitions = ""
  let hoistedEnumImports = ""
  let hoistedArrowFunctions = ""

  /**
   * These are almost always an error - it's invalid to write let x = 5 outside of
   * a method scope in ts2gd. However, we use them for two reasons.
   *
   * 1. They make test writing a heck of a lot more convenient - no need to wrap
   * everything in a class
   * 2. They are used to declare the autoload global variable.
   */
  let toplevelStatements: ts.Statement[] = []

  const files: { filePath: string; body: string }[] = []

  for (const statement of statements) {
    if (
      statement.kind !== SyntaxKind.ClassDeclaration &&
      statement.kind !== SyntaxKind.ClassExpression
    ) {
      toplevelStatements.push(statement)

      continue
    }

    const parsedStatement = parseNode(statement, props)

    if (!statement.modifiers?.map((m) => m.getText()).includes("declare")) {
      // TODO: Push this logic into class declaration and expression classes

      const classDecl = statement as ts.ClassDeclaration | ts.ClassExpression
      const className = classDecl.name?.text

      // if (!className) {
      //   addError({
      //     description: "Anonymous classes are not supported",
      //     error: ErrorName.ClassCannotBeAnonymous,
      //     location: classDecl,
      //     stack: new Error().stack ?? "",
      //   })

      //   continue
      // }

      parsedClassDeclarations.push({
        fileName:
          props.sourceFileAsset.gdContainingDirectory + className + ".gd",
        parsedClass: parsedStatement,
        classDecl,
      })
    }

    for (const lf of parsedStatement.hoistedLibraryFunctions ?? []) {
      hoistedLibraryFunctionDefinitions +=
        LibraryFunctions[lf].definition("__" + LibraryFunctions[lf].name) + "\n"
    }

    for (const af of parsedStatement.hoistedArrowFunctions ?? []) {
      hoistedArrowFunctions += af.content + "\n"
    }

    for (const fi of parsedStatement.files ?? []) {
      files.push(fi)
    }
  }

  const codegenToplevelStatements =
    toplevelStatements.length > 0
      ? combine({
          nodes: toplevelStatements,
          parent: toplevelStatements[0].parent,
          props,
          parsedStrings: (...strs) => strs.join("\n"),
        })
      : undefined

  for (const lf of codegenToplevelStatements?.hoistedLibraryFunctions ?? []) {
    hoistedLibraryFunctionDefinitions +=
      LibraryFunctions[lf].definition("__" + LibraryFunctions[lf].name) + "\n"
  }

  for (const af of codegenToplevelStatements?.hoistedArrowFunctions ?? []) {
    hoistedArrowFunctions += af.content + "\n"
  }

  for (const fi of codegenToplevelStatements?.files ?? []) {
    files.push(fi)
  }

  let classFile: {
    mainClass: ParsedClassDeclaration | null
    innerClasses: ParsedClassDeclaration[]
  } = {
    mainClass: null,
    innerClasses: [],
  }

  for (const cls of parsedClassDeclarations) {
    if (cls.classDecl.modifiers?.map((x) => x.getText()).includes("default")) {
      classFile.mainClass = cls
    } else {
      classFile.innerClasses.push(cls)
    }
  }

  let fileBody = `${getFileHeader()}\n`

  if (classFile.mainClass) {
    fileBody += `${getClassDeclarationHeader(
      classFile.mainClass.classDecl,
      props
    )}\n`
  }

  fileBody += `
${hoistedEnumImports}
${hoistedLibraryFunctionDefinitions}
${hoistedArrowFunctions}
${codegenToplevelStatements?.content ?? ""}
${classFile.innerClasses
  .map(
    (innerClass) => `
${getClassDeclarationHeader(innerClass.classDecl, props)}
${
  innerClass.parsedClass.content.trim()
    ? innerClass.parsedClass.content
        .trim()
        .split("\n")
        .map((line) => "  " + line)
        .join("\n")
    : "  pass"
}
`
  )
  .join("\n")}
`

  if (classFile.mainClass) {
    fileBody += `${classFile.mainClass.parsedClass.content}\n`
  }

  files.push({
    filePath: props.sourceFileAsset.gdPath,
    body: fileBody,
  })

  return {
    files,
    content: "",
  }
}

export const testToolAnnotation: Test = {
  ts: `
@tool
export default class Test {
}
  `,
  expected: `
tool
class_name Test
`,
}

export const testInnerClass: Test = {
  ts: `
export default class Test {
}

export class InnerTest {
  field: int = 2;
}
  `,
  expected: `
class_name Test

class InnerTest:
  var field: int = 2
`,
}

export const testAnonymousClass: Test = {
  ts: `
export default class extends Node2D {
}
  `,
  expected: `
extends Node2D
`,
}

// TODO: cleanup, this test is no longer valid

// export const testTwoClasses: Test = {
//   ts: `
// export class Test1 { }
// export class Test2 { }
//   `,
//   expected: {
//     type: "multiple-files",
//     files: [
//       {
//         fileName: "/Users/johnfn/MyGame/compiled/Test1.gd",
//         expected: `class_name Test1`,
//       },
//       {
//         fileName: "/Users/johnfn/MyGame/compiled/Test2.gd",
//         expected: `class_name Test2`,
//       },
//     ],
//   },
// }
