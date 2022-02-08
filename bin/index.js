#!/usr/bin/env node
// eslint-disable-next-line @typescript-eslint/no-var-requires
const package = require("../package.json")
const ts2gd = require("../js/main.js")
const version = package.version
const run = ts2gd.run
run(version)
