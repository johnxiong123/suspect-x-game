<div align="center">

<img src="assets/images/title_keyvisual.png" alt="嫌疑犯X的献身 · 互动推理" width="100%">

# 嫌疑犯X的献身 · 互动推理

**一款基于东野圭吾《嫌疑犯X的献身》改编的分支推理视觉小说（Visual Novel）**

🚧 **制作中（Work in Progress）** — 当前进度：P0 垂直切片，第一章可玩

</div>

---

## 简介

以东野圭吾经典推理小说《嫌疑犯X的献身》为蓝本，做成一款**沉浸式分支互动推理游戏**。
形式参考《人狼村之谜》(Raging Loop)：阅读剧情、在关键节点抉择，选择影响**状态变量**并在转折点分叉，最终走向多个结局；配 **流程图 / 路线图** 回溯重玩、**证物档案** 回顾线索。

> ⚠️ 本项目为出于学习与兴趣的同人 / 个人作品，非商业用途。详见 [版权声明](#版权声明)。

## ✨ 特性

- 🎭 **分支叙事 · 多结局** — 珠链式分支 + 状态变量收束，目标 4–6 个结局
- 🗺️ **流程图回跳** — 已读节点可点击重玩，未解锁分支显示 `?`（人狼村式路线图）
- 🔍 **证物 / 线索系统** — 调查解锁线索，部分选项需持有特定线索才出现
- 📊 **状态变量** — 怀疑度 / 决意 / 信任 / 愧疚，随选择浮动并决定结局
- 🎬 **暗调半写实美术** — 场景插画 + 关键事件 CG，电影感氛围
- 🧩 **数据驱动引擎** — 剧情即数据（JSON），引擎与内容分离
- 💾 存读档 / 回想(backlog) / 自动 · 跳过 / 结局画廊

## 🖼️ 美术预览

|  |  |  |
|:-:|:-:|:-:|
| ![](assets/images/bg_tentei_day.png) | ![](assets/images/cg_interrogation_climax.png) | ![](assets/images/bg_yasuko_apt_night.png) |
| 天亭便当店 | 侦讯室对峙 | 靖子的公寓 |

## 🎮 运行

```bash
# 推荐：零依赖 no-cache 静态服务器（开发期永远加载最新代码，免硬刷新）
node scripts/serve.mjs 8099
# 或：python3 -m http.server 8099（注意浏览器会缓存 JS，改动后需 Cmd+Shift+R 硬刷新）

# 然后浏览器访问 http://localhost:8099
```

## 📁 项目结构

```
index.html · main.js          入口与装配
engine/                       数据驱动引擎（状态机 / 节点遍历 / 条件求值 / 存档）
ui/                           场景 / 对话框 / 导航 / 流程图 / 证物 / 状态 / 菜单
data/  chapters/chNN.json     剧情节点图 + clues / characters / endings
styles/                       暗调主题样式
assets/  manifest.json        图片清单（id → 路径）
         images/              美术资产
         prompts.(json|md)    各图的生成提示词
scripts/ sync-manifest.mjs    出图后回填 manifest
tests/   engine.test.mjs      引擎单测（node 直接运行）
```

## 🗺️ 开发进度

- [x] **P0** — 数据驱动引擎 + 第一章垂直切片 + 核心 UI + 美术接入 + 引擎单测
- [ ] **P1** — 第 2–13 章 · 流程图回跳重玩 · 多视角切换 · 完整线索系统
- [ ] **P2** — 终章多结局收束 · 结局画廊 · 全量美术替换 · 平衡润色

## 🎨 美术资产流水线

共 29 张（10 场景背景 + 10 事件 CG + 8 线索图标 + 1 封面），统一为暗调半写实动漫 VN 风。

1. 提示词见 [`assets/prompts.md`](assets/prompts.md) / [`assets/prompts.json`](assets/prompts.json)
2. 出图后按文件名存入 `assets/images/`
3. 运行 `node scripts/sync-manifest.mjs` 回填，刷新浏览器即生效（占位自动替换为正式美术）

## 🛠 技术栈

原生 HTML / CSS / JavaScript（ES Modules）。无构建步骤、无框架、零运行时依赖。

## 版权声明

- 原著《嫌疑犯X的献身》版权归 **东野圭吾** 及其出版方所有；本项目为**非商业**的同人 / 学习作品。
- 本仓库**不包含**原著文本，剧情为改编转写。
- 美术资产由 AI 依据本项目提示词生成，仅用于本项目演示。
- 如涉及侵权，请联系删除。

---

<sub>🚧 制作中 · 部分内容借助 Claude Code 协作完成。</sub>
