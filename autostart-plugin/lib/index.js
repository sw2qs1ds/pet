/**
 * pet-assets-autostart —— 引擎启动时把桌宠素材服务拉起来。
 *
 * 素材服务在 /root/workspace/pet/scripts/asset-server.mjs：把 assets/all 下 114 段
 * 透明动画以 HTTP 提供，供插件按需 fetch（不塞进 76MB 的 JS 包）。
 *
 * 这里只做一件事：探一下 8766 端口，没人监听就 detached 起一个「崩溃自动重拉」的
 * 守护循环，然后立刻返回，不阻塞引擎启动。
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { connect } from "node:net";
import path from "node:path";

export const name = "pet-assets-autostart";

const DIR = process.env.PET_ASSETS_DIR || "/root/workspace/pet";
const PORT = Number(process.env.PET_ASSETS_PORT || 8766);

function portOpen(port, timeoutMs = 600) {
  return new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port });
    const finish = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

export async function apply(ctx) {
  if (await portOpen(PORT)) {
    ctx.logger?.info?.(`[pet-assets] 127.0.0.1:${PORT} 已在运行，跳过启动`);
    return;
  }

  const entry = path.join(DIR, "scripts", "asset-server.mjs");
  if (!existsSync(entry)) {
    ctx.logger?.warn?.(`[pet-assets] 找不到 ${entry}，无法启动素材服务`);
    return;
  }

  try {
    const child = spawn(
      "sh",
      ["-c", "while true; do node scripts/asset-server.mjs >> /tmp/pet-assets.out 2>&1; sleep 2; done"],
      { cwd: DIR, detached: true, stdio: "ignore" },
    );
    child.unref();
    ctx.logger?.info?.(`[pet-assets] 已启动素材服务（pid ${child.pid}，${DIR}）`);
  } catch (error) {
    ctx.logger?.warn?.(`[pet-assets] 启动失败：${error?.message ?? error}`);
  }
}
