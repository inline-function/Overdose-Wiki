# Overdose Wiki — 新会话接手指南

> 新会话先完整读这份，再读 DLC_DESIGN_NOTES.md / DLC_UI_HANDOFF.md。本文件覆盖：项目/技术栈/进度/下一步/文件/注意事项/云端/生图API。

## 1. 项目是什么
**Overdose Wiki（ODW）**：像素风视觉小说网页游戏，外壳是复古 wiki 浏览器窗口（标题栏+地址栏+480×270 画布+CRT 扫描线）。题材「药圈」与过量，**立场减害与纪念，不宣扬用药**。
- 主线 4 章（ch01–04）跟后藤等人物；阅读 VN+报告/文档+卡牌战斗。
- afterstory《在漫长岁月之后》：可玩派别模拟（8 回合）。聊天式番外若干。
- DLC《稍尽春风》：纪念春风（Harukaze，19 岁早慧天才药师，参宿四红星头+白大褂+74 胸牌，2023.01.08 死于死藤水+麻黄碱+哈马林）。8 关卡牌战役，敌人是八种症状/情绪/困境（失眠/戒断/解离/自责/空洞/幻觉/父亲的质问/死亡冲动），不是人。结局「症状安静，春风还在」。**不殉道化**。
- 下一个 DLC《未曾翻开的自我》：角色向，待定义。

## 2. 技术栈
React 19 + TypeScript 7 + Vite 8(rolldown) + react-router-dom 7(hash) + zustand 5。
CSS Modules + 像素字体(Fusion Pixel/Cubic)。vitest 5 + Playwright 1.65。纯客户端：localStorage 存档、静态资源、Web Audio，无后端。
打包：Capacitor 6→APK、Electron 33→EXE；GitHub Actions tag v* 自动出包。

## 3. 当前进度（v2.0.3，已上云）
《稍尽春风》完整闭环：封面展示→开场动画(点进入播放/重播)→战役+战前剧情(interlude-1..8)→八关战斗(专属BGM/拖拽出牌/长按详情/反馈动效)→奖励/抽卡(4池+概率+保底+歪保底)/强化/流派/激活→无尽模式→尾幕→结局。
商店含麻精专柜(精二200/精一麻300)。流派增强+激活功能只给玩家。全屏/填充/横屏。
139/139 测试、build:private 通过。APK/EXE CI 出包验证过，APK 用户手动安装。
主线 4 章可读、afterstory 可玩。

## 4. 接下来要干什么
开发《未曾翻开的自我》：
1. 定角色/主题/机制差异（读 设计文档/人物心理侧写）。
2. 选架构：**推荐平行模块 src/dlc2 + 复用战斗引擎/UI**（隔离清晰）；或抽象多DLC框架（改动大）。
3. 复用 engine/战斗UI/抽卡/强化/激活；换内容+立绘+剧情+音乐。
4. 完成后**大版本**提交+tag+CI 出包+装机。

## 5. 文件们是干什么的
- src/dlc/types.ts 数据模型；content.ts 卡/关/舞台/STATUS_INFO/UPGRADE/BUILD/ABILITY_DEFS/shopPrice/CONTROLLED_SHOP；engine.ts 战斗引擎(createBattle/playerPlay/endPlayerTurn/tutorDraw/spendHeal/exhaustCard)；store.ts zustand 存档+动作；gacha.ts 池/概率/保底；story.ts 独立VN；save.ts 迁移；format.ts/icons.ts 展示。
- src/pages/DlcCoverPage(封面+开场)/DlcCampaignPage/DlcBattlePage(含endless)/DlcShopPage(6tab)/DlcStoryPage/DlcEndingPage；Dlc.module.css 全部DLC样式。
- src/components/HarukazeBust(差分立绘)/CardDetail(长按详情,portal+fixed)。
- src/openings/dlc.ts+registry.ts 开场画布；ChapterOpening.tsx 播放器。
- src/game/scale.ts 缩放+useFullscreen；store.ts 主存档；src/app/GameShell.tsx 外壳+全屏按钮；router.tsx 路由+DlcGuard。
- src/audio/manifest.ts+cues.ts+AudioManager 音乐；src/i18n/messages.zh.ts(源)/en.ts。
- tools/qwen_image.py 生图；pixelize.py 像素化；build-audio.py/check-audio.mjs 音频；validate-content.mjs；verify-*.cjs/smoke-*.cjs Playwright 验证。
- public/assets/dlc 公开入口图；public/assets-private/dlc+bg 私有立绘/背景(已入库)；public/audio/bgm 音乐。
- android/ Capacitor 工程；electron/main.cjs+electron-builder.yml；.github/workflows/release.yml 出包。
- 语料库/设计文档/美术资源 gitignore 本地参考。

## 6. 开发注意事项
- 伦理：无合成/配方/剂量；纪念不美化；od史.txt CC BY-ND 只参考事实。星头**无脸**。
- 玩家增益(属性/流派/激活)**绝不泄漏敌方**（dlc-noleak.test.ts 锁定）。
- i18n 以 messages.zh.ts 为源(as const)，en 对照。音乐署名「音乐由[乌鸦Producer]提供」；check-audio ≤4.5MB/cue。
- 运行所需资源要入库（Pages 用 build:private）。私有素材生成器入库、凭证不入库。
- 动画 steps() 像素步进、分级抽卡；reduced-motion 降级；滚动容器 touch-action/momentum；浮层 portal+fixed 不随滚。
- 环境：run_code 默认120s，长任务用 run_in_background；Playwright executablePath=/root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome +--no-sandbox+waitUntil load；bash 变量用 ${var} 花括号。
- git 走 SSH deploy key(~/.ssh/odw_deploy)；http.sslBackend 勿设 schannel。

## 7. 云端链接 + 提交纪律
- HTTPS https://github.com/inline-function/Overdose-Wiki ；SSH git@github.com:inline-function/Overdose-Wiki.git 。
- **只在大版本提交+打 tag(v2.x) 触发 CI 出包；平时开发不要提交/推送。**

## 8. 生图 API 与 key
- DashScope 原生多模态路由：{QWEN_BASE_URL}/api/v1/services/aigc/multimodal-generation/generation（不是 /images/generations）。
- 模型默认 qwen-image-3.0-pro；工具 tools/qwen_image.py（--prompt-file/--size/--seed/--negative/--out）。
- 凭证 QWEN_BASE_URL/QWEN_API_KEY 在 **/root/workspace/.env.local（仓库外）**。新会话直接读该文件取 key；**绝不把 key 写进任何会提交的文件**。
- 像素化 tools/pixelize.py（品红抠图+LANCZOS+24色）。
