# pet

一只住在手机上的陪伴型桌宠。核心不是替你干活，而是**在场**——偶尔搭句话、记得你的事、看你忙就不打扰。

> **代码 MIT · 美术素材 CC BY-NC-SA 4.0（非商业）· 出处见 [CREDITS.md](CREDITS.md)**

## 状态

早期开发中（v0.1）。当前只做 DSH 客户端插件 + 一层薄壳 APK；不上架、不商用。

## 它是什么

- **宠物本体**：能在页面里走动、待机、被点击时有反应，冒气泡说话
- **能聊天**：说的话进当前 DSH 会话，回复由宠物念出来
- **有人格**：名字、称呼、脾气可改
- **有记忆**：记得你提过的事，重启还认得你
- **安静模式**：忙的时候不打扰

## 结构（规划）

```
pet-core    状态机 / 动画调度 / 记忆 / 气泡 / 工具接口
brain-dsh   现在：接 DSH（remote.session.prompt）
brain-direct  以后：独立 App 直连模型 API（当前不实现）
shell       WebView 薄壳 APK，只负责显示与悬浮窗
```

## 许可

- 代码：MIT（见 [LICENSE](LICENSE)）
- 美术素材：CC BY-NC-SA 4.0，来自 [PC2005-cloud/dsh-pet](https://github.com/PC2005-cloud/dsh-pet)，**不可商用**
- 基于本项目做二创并公开时，须附原作者地址：https://github.com/PC2005-cloud/dsh-pet
