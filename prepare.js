/* eslint-disable @typescript-eslint/no-var-requires */
const isCi = process.env.CI !== undefined
if (!isCi) {
  require("husky").install()
}
