/**
 * pet-overlay · 宿主侧
 *
 * 宠物全部逻辑在浏览器（lib/client.js）；这里只做两件事：
 * 1. 让 pet-overlay 成为合法的插件行（客户端模块只扫描加载树里的包）；
 * 2. 写一行加载标记，便于确认「宿主是否真的加载了这一行」。
 */
import { appendFileSync } from "node:fs";

export const name = "pet-overlay";

export function apply() {
  try {
    appendFileSync("/tmp/pet-overlay-host.log", `${new Date().toISOString()} host-entry loaded\n`);
  } catch {
    /* 标记失败不影响任何功能 */
  }
}
