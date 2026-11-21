#!/usr/bin/env node
/**
 * 桌宠素材服务：把 assets/all/*.webm 以 HTTP 提供，供插件按需加载。
 *
 *   node scripts/asset-server.mjs [--port 8766] [--dir assets/all]
 *
 * 端点：
 *   GET /list.json        → { files: [名字…] }
 *   GET /a/<名字>.webm    → 动画本体（CORS 放开，只给本机页面用）
 *   GET /health           → OK
 */
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = Number(argOf("port", process.env.PET_ASSET_PORT || 8766));
const DIR = path.resolve(root, argOf("dir", "assets/all"));

function listFiles() {
  try {
    return readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".webm")).sort();
  } catch {
    return [];
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
};

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  if (pathname === "/health") {
    res.writeHead(200, { ...CORS, "content-type": "text/plain" });
    res.end("OK");
    return;
  }

  if (pathname === "/list.json") {
    const files = listFiles();
    res.writeHead(200, { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify({ dir: DIR, count: files.length, files }));
    return;
  }

  if (pathname.startsWith("/a/")) {
    const name = pathname.slice(3);
    if (!name || name.includes("/") || name.includes("..")) {
      res.writeHead(404, CORS);
      res.end("not found");
      return;
    }
    const file = path.join(DIR, name);
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, CORS);
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      ...CORS,
      "content-type": "video/webm",
      "cache-control": "public, max-age=3600",
    });
    createReadStream(file).pipe(res);
    return;
  }

  res.writeHead(404, CORS);
  res.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[pet-assets] http://127.0.0.1:${PORT}/list.json (${listFiles().length} 段)`);
});
