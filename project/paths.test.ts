import anymatch from "anymatch"

import { fixtures, mockProjectPath } from "../tests"

import { Paths } from "./paths"

describe("Paths", () => {
  test("check instantiation", () => {
    const paths = new Paths(fixtures.args)
    expect(paths.rootPath).toBe(mockProjectPath())
  })

  const cases: [string, boolean][] = [
    ["/root/some.png", false],
    ["/root/some.abc", true],
    ["/root/some.ts", false],
    ["/root/some.d.ts", true],
    ["/root/folder/some.ts", false],
    ["/root/folder/some.d.ts", true],
    ["/root/folder/README", true],
    ["/root/LICENSE", true],
    ["/root/node_modules/", true],
    ["/root/node_modules/some.ts", true],
    ["/root/node_modules/some.d.ts", true],
    ["/root/node_modules/some.png", true],
    ["/root/node_modules/some.abc", true],
    ["/root/.git/", true],
    ["/root/.git/some.ts", true],
    ["/root/.git/some.d.ts", true],
    ["/root/project.godot", false],
    ["/root/folder/", false],
    ["/root/folder/nested/", false],
  ]

  const paths = new Paths(fixtures.args)
  const toIgnore = paths.ignoredPaths()
  const matcher = anymatch(toIgnore)

  test.each(cases)("ignore list - %s %p", (path, result) => {
    expect(matcher(path)).toBe(result)
  })
})
