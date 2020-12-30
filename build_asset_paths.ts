import { TsGdProjectClass } from "./project/project"
import fs from "fs"
import path from "path"

export async function buildAssetPathsType(project: TsGdProjectClass) {
  const assetFileContents = `
declare type AssetType = {
${project.assets
  .filter((obj) => obj.tsType() !== null)
  .map((obj) => `  '${obj.resPath}': ${obj.tsType()}`)
  .join(",\n")}
}

declare type AssetPath = keyof AssetType;
  `

  const destPath = path.join(project.godotDefsPath, "@asset_paths.d.ts")
  fs.writeFileSync(destPath, assetFileContents)
}