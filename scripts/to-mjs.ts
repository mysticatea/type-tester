import fs from "fs"

fs.writeFileSync(
    "dist/index.mjs",
    fs
        .readFileSync("dist/index.js", "utf8")
        .replace(/index\.js/gu, "index.mjs"),
)

fs.writeFileSync(
    "dist/index.mjs.map",
    fs
        .readFileSync("dist/index.js.map", "utf8")
        .replace(/index\.js/gu, "index.mjs"),
)
