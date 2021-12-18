import fs from "fs"
import path from "path"
import { AssetGodotScene } from "../assets/asset_godot_scene"
import { AssetSourceFile } from "../assets/asset_source_file"
import { TsGdProjectClass } from "../project"

export function buildAssetPathsType(project: TsGdProjectClass) {
  const assetFileContents = `
declare type AssetType = {
${project.assets
  .filter((obj) => obj.tsType() !== null)
  .map((obj) => {
    const tsType = obj.tsType()

    if (!tsType) {
      return ""
    }

    if (obj instanceof AssetSourceFile || obj instanceof AssetGodotScene) {
      return `  '${obj.resPath}': PackedScene<${tsType}>`
    }

    return `  '${obj.resPath}': ${tsType}`
  })
  .join(",\n")}
}

declare type SceneName =
${
  project.assets
    .filter((obj): obj is AssetGodotScene => obj instanceof AssetGodotScene)
    .map((obj) => `  | '${obj.resPath}'`)
    .join("\n") || "  never;"
}

declare type AssetPath = keyof AssetType;
  `

  const destPath = path.join(
    TsGdProjectClass.Paths.dynamicGodotDefsPath,
    "@asset_paths.d.ts"
  )
  fs.writeFileSync(destPath, assetFileContents)
}
