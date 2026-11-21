/**
 * brain：宠物的大脑适配器。
 * 现在只有 local（本地台词，用来验证对话 UI 与接口）；
 * 插件化以后加 dsh（走 remote.session.prompt），界面不用改。
 */
(() => {
  "use strict";

  /** @typedef {{ask:(text:string)=>Promise<string>}} Brain */

  const REPLIES = [
    "唔…我在想。",
    "你说这个，我记下了。",
    "这样啊，那后来呢？",
    "嗯嗯，继续说。",
    "我有点困了，但还在听。",
    "这个词好难，我装懂一下。",
  ];

  const local = {
    async ask(text) {
      await new Promise((r) => setTimeout(r, 380 + Math.random() * 520));
      if (/你好|hi|hello/i.test(text)) return "你来啦。";
      if (/记|别忘了/.test(text)) return "记下了，不会忘。";
      if (/[?？]$/.test(text)) return "我猜…是吧？";
      return REPLIES[Math.floor(Math.random() * REPLIES.length)];
    },
  };

  /** 占位：插件化后把这里换成 remote.session.prompt */
  const dsh = {
    async ask() {
      throw new Error("brain-dsh 尚未接入");
    },
  };

  window.PetBrain = { local, dsh, current: local };
})();
