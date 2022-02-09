import fs from "fs"
import path from "path"
import process from "process"

import type { Matcher } from "anymatch"

import { ParsedArgs } from "../parse_args"
import { defaultTsconfig } from "../generate_library_defs/generate_tsconfig"
import { showInfo } from "../tui"

import { allAssetExtensions } from "./assets"

// TODO: Do sourceTsPath and destGdPath have to be relative?

export class Paths {
  /** Where the .ts files live, e.g. ./src */
  readonly sourceTsPath: string

  /** Where the compiled .gd files go, e.g. ./compiled */
  readonly destGdPath: string

  /** The root path of the project */
  readonly rootPath: string

  /** The full path to the tsconfig file. e.g. /Users/johnfn/GodotProject/tsconfig.json */
  readonly tsconfigPath: string

  /** The path to the Godot definitions folder for unchanging library definitions.
   * e.g. /Users/johnfn/GodotProject/_godot_defs/static */
  readonly staticGodotDefsPath: string

  /** The path to the Godot definitions folder for definitions based off user files.
   * e.g. /Users/johnfn/GodotProject/_godot_defs/dynamic */
  readonly dynamicGodotDefsPath: string

  /** The path to the Godot repository, e.g. /Users/johnfn/Godot */
  readonly godotSourceRepoPath: string | undefined

  readonly csgClassesPath: string

  readonly websocketClassesPath: string

  readonly normalClassesPath: string

  readonly gdscriptPath: string

  readonly additionalIgnores: string[]

  resPathToFsPath(resPath: string) {
    return path.normalize(
      path.join(this.rootPath, resPath.slice("res://".length))
    )
  }

  normalizeToPosix(fsPath: string) {
    return path.normalize(fsPath).replaceAll(path.sep, path.posix.sep)
  }

  fsPathToResPath(fsPath: string) {
    return `res://${this.normalizeToPosix(
      path.relative(this.rootPath, fsPath)
    )}`
  }

  replaceResExtension(resPath: string, replacement: string) {
    return resPath.replace(/\.[0-9a-z]+$/i, replacement)
  }

  removeExtension(fsPath: string) {
    if (fsPath.startsWith("res://")) {
      throw new Error("removeExtension isn't supported for res:// paths")
    }
    return path.join(
      path.dirname(fsPath),
      path.basename(fsPath, path.extname(fsPath))
    )
  }

  replaceExtension(fsPath: string, replacement: string) {
    return `${this.removeExtension(fsPath)}${replacement}`
  }

  tsRelativePath(fsPath: string, withExtension = false) {
    // on win this would have \, but we need /
    return this.normalizeToPosix(
      path.relative(
        path.dirname(this.tsconfigPath),
        withExtension ? fsPath : this.removeExtension(fsPath)
      )
    )
  }

  gdPathForTs(sourceFilePath: string) {
    return path.join(
      this.destGdPath,
      this.replaceExtension(
        path.relative(this.sourceTsPath, sourceFilePath),
        ".gd"
      )
    )
  }

  gdName(gdPath: string) {
    return path.basename(gdPath, path.extname(gdPath))
  }

  ignoredPaths(): Matcher {
    return [
      "**/node_modules/**",
      "**/_godot_defs/**",
      "**/.git/**",
      // ignore all files that aren't one of our extensions
      new RegExp(`^(?!.+(${allAssetExtensions().join("|")})$).*\\..*$`, "i"),
      // and ignore all .d.ts files (as they have our ts extension)
      new RegExp(/.*\.d\.ts$/, "i"),
      // and some files with no extension
      new RegExp(/(README|LICENSE)$/, "i"),

      ...this.additionalIgnores,
    ]
  }

  /** Should we strip comments from the godot output? */
  removeComments: boolean

  constructor(args: ParsedArgs) {
    if (args.init) {
      this.init()
      process.exit(0)
    }

    let ts2gdPath = ""

    let fullyQualifiedTs2gdPathWithFilename: string
    let fullyQualifiedTs2gdPath: string

    if (args.tsgdPath) {
      ts2gdPath = args.tsgdPath

      // relativeTs2gdPath is now a path of some sort, but it could be a relative path (e.g. "./ts2gd.json").
      // Let's make it fully qualified.

      if (ts2gdPath.startsWith("/")) {
        // absolute path

        fullyQualifiedTs2gdPathWithFilename = ts2gdPath
      } else if (ts2gdPath.startsWith(".")) {
        // some sort of relative path, so resolve it

        fullyQualifiedTs2gdPathWithFilename = path.join(
          __dirname,
          args.tsgdPath
        )
      }
    } else {
      // Check if we can find the ts2gd.json in the current folder

      const ts2gdInCurrentFolderPath = path.join(process.cwd(), "ts2gd.json")

      if (!fs.existsSync(ts2gdInCurrentFolderPath)) {
        console.error("No ts2gd.json file found.")
        console.error("Try running ts2gd --init.")

        process.exit(0)
      }

      ts2gdPath = ts2gdInCurrentFolderPath
    }

    fullyQualifiedTs2gdPathWithFilename = ts2gdPath

    fullyQualifiedTs2gdPath = path.dirname(fullyQualifiedTs2gdPathWithFilename)

    //TODO: type this
    const tsgdJson = JSON.parse(
      fs.readFileSync(fullyQualifiedTs2gdPathWithFilename, "utf-8")
    )

    // TODO: Assert that these are found on the json object
    this.sourceTsPath = path.join(fullyQualifiedTs2gdPath, tsgdJson.source)
    this.destGdPath = path.join(fullyQualifiedTs2gdPath, tsgdJson.destination)
    this.rootPath = fullyQualifiedTs2gdPath
    this.staticGodotDefsPath = path.join(this.rootPath, "_godot_defs", "static")
    this.dynamicGodotDefsPath = path.join(
      this.rootPath,
      "_godot_defs",
      "dynamic"
    )

    this.godotSourceRepoPath =
      (tsgdJson.godotSourceRepoPath &&
        path.join(fullyQualifiedTs2gdPath, tsgdJson.godotSourceRepoPath)) ||
      undefined

    this.csgClassesPath = path.join(
      this.godotSourceRepoPath ?? "",
      "modules/csg/doc_classes"
    )

    this.websocketClassesPath = path.join(
      this.godotSourceRepoPath ?? "",
      "modules/websocket/doc_classes"
    )

    this.normalClassesPath = path.join(
      this.godotSourceRepoPath ?? "",
      "doc/classes"
    )

    this.gdscriptPath = path.join(
      this.godotSourceRepoPath ?? "",
      "modules/gdscript/doc_classes"
    )

    this.additionalIgnores = tsgdJson.ignore ?? []

    this.removeComments = tsgdJson.removeComments ?? false

    this.tsconfigPath = path.join(
      path.dirname(fullyQualifiedTs2gdPathWithFilename),
      "tsconfig.json"
    )

    if (!fs.existsSync(this.tsconfigPath)) {
      showInfo("Creating tsconfig.json")

      fs.writeFileSync(this.tsconfigPath, defaultTsconfig)
    }
  }

  /**
   * Called when a user types ts2gd --init
   */
  init() {
    let destPath = path.join(process.cwd(), "ts2gd.json")

    fs.writeFileSync(
      destPath,
      `{
  "destination": "./compiled",
  "source": "./src"
}`
    )

    // Can't hurt!
    fs.mkdirSync("compiled", { recursive: true })
    fs.mkdirSync("src", { recursive: true })
    fs.mkdirSync(".vscode", { recursive: true })

    const launch = path.join(process.cwd(), ".vscode", "launch.json")

    // TODO: Put in a separate file.
    if (!fs.existsSync(launch))
      fs.writeFileSync(
        launch,
        `{
      "version": "0.2.0",
      "configurations": [
        {
          "name": "GDScript Godot",
          "type": "godot",
          "request": "launch",
          "project": "$\{workspaceFolder}",
          "port": 6007,
          "address": "127.0.0.1",
          "launch_game_instance": true,
          "launch_scene": false
        }
      ]
    }`
      )

    console.info("ts2gd.json created.")
    console.info("compiled/ created.")
    console.info("src/ created.")
  }
}

export default Paths
