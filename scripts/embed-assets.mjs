#!/usr/bin/env node
/**
 * 把 plugin/assets/*.webm 内联进 lib/client.js 的 ASSETS 映射（data URL）。
 * 宿主只提供 png/webp/svg 静态资源，视频必须内联。
 *
 *   node scripts/embed-assets.mjs
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const assetsDir = path.join(root, "plugin", "assets");
const clientPath = path.join(root, "plugin", "lib", "client.js");

const files = readdirSync(assetsDir).filter((f) => /\.(webm|mp4)$/i.test(f));
if (!files.length) {
  console.error("no assets found in", assetsDir);
  process.exit(1);
}

const entries = files.map((f) => {
  const bytes = readFileSync(path.join(assetsDir, f));
  const name = path.basename(f, path.extname(f));
  const mime = f.toLowerCase().endsWith(".mp4") ? "video/mp4" : "video/webm";
  return `        ${JSON.stringify(name)}: "data:${mime};base64,${bytes.toString("base64")}",`;
});

const block = [
  "      // >>>ASSETS（由 scripts/embed-assets.mjs 生成，勿手改）",
  "      const ASSETS = {",
  ...entries,
  "      };",
  "      // <<<ASSETS",
].join("\n");

const src = readFileSync(clientPath, "utf8");
const re = / {6}\/\/ >>>ASSETS[\s\S]*?\/\/ <<<ASSETS/;
if (!re.test(src)) {
  console.error("marker block not found in", clientPath);
  process.exit(1);
}
writeFileSync(clientPath, src.replace(re, block));

const total = files.reduce((n, f) => n + statSync(path.join(assetsDir, f)).size, 0);
console.log(`embedded ${files.length} asset(s), ${(total / 1048576).toFixed(1)} MB -> ${(total * 1.37 / 1048576).toFixed(1)} MB base64`);
