import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const registered = JSON.parse(await readFile("THREEUI-SOURCE.json", "utf8"));
for (const source of registered.files) {
  const bytes = await readFile(path.join("packages/threeui", source.path));
  if (createHash("sha256").update(bytes).digest("hex") !== source.sha256) throw new Error("Registered ThreeUI source changed: " + source.path);
}

await build({
  entryPoints: ["src/Scene.tsx"],
  outfile: "dist/assets/threeui-paper.js",
  bundle: true, format: "esm", jsx: "automatic", minify: true,
  define: {"process.env.NODE_ENV": '"production"'},
  external: ["./fonts/*"],
  plugins: [{name: "registered-html-source", setup(builder) {
    builder.onResolve({filter: /\.html\?raw$/}, args => ({path: path.resolve(args.resolveDir,args.path.slice(0,-4)),namespace:"registered-html-source"}));
    builder.onLoad({filter: /.*/,namespace:"registered-html-source"}, async args => ({contents:await readFile(args.path,"utf8"),loader:"text"}));
  }}]
});
