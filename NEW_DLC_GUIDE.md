# 新 DLC 开发指南（bootstrap）

> 给新会话的接手文档。先读这份 + DLC_DESIGN_NOTES.md + DLC_UI_HANDOFF.md，再动手。
> 现有 DLC《稍尽春风》已完成（v2.0.3），代码在 src/dlc + src/pages/Dlc*。

## 项目是什么

**Overdose Wiki（ODW）** 是一个像素风视觉小说网页游戏，外壳做成复古 wiki 浏览器窗口（标题栏+地址栏+480×270 像素画布+CRT 扫描线）。题材是「药圈」与过量（overdose）：描写人物在药物使用、依赖与丧失中的处境，**立场是减害与纪念，不是宣扬用药**。

- **主线**：4 章（ch01–04），跟随后藤等人物穿过药圈；阅读 VN + 报告/文档 + 卡牌战斗 + afterstory《在漫长岁月之后》派别模拟 + 聊天式番外。
- **DLC《稍尽春风》**：纪念春风（Harukaze）——19 岁早慧天才药师，参宿四红星头+白大褂+74 胸牌，2023.01.08 死于死藤水+麻黄碱+哈马林。8 关卡牌战役，敌人是八种症状/情绪/困境（失眠/戒断/解离/自责/空洞/幻觉/父亲的质问/死亡冲动），不是人。结局「症状暂时安静，春风还在」。基调纪念/减害、**不殉道化**。
- **新 DLC《未曾翻开的自我》**：下一个角色向 DLC，角色/主题/机制待新会话定义。

**伦理红线**：无合成路线/配方/剂量；纪念而非美化；od史.txt 为 CC BY-ND，只参考事实不改编文字。角色心理侧写在 设计文档/重写文本/人物心理侧写/（春风.md 等）。

**审美**：复古 wiki 窗、像素立绘、CRT、步进动画（steps()）、分级抽卡/动效参考 afterstory。

## 技术栈
React 19 + TS 7 + Vite 8（rolldown）+ react-router 7（hash）+ zustand 5。
CSS Modules + 像素字体；vitest + Playwright。纯客户端（localStorage 存档、静态资源、Web Audio）。
打包：Capacitor→APK、Electron→EXE，GitHub Actions tag v* 自动出包（.github/workflows/release.yml）。

## 现有 DLC 架构（稍尽春风，可复用）
- src/dlc/types.ts：Card/StatusId/BattleDef/DlcSave/Builds/Abilities/GachaPity。
- src/dlc/content.ts：60 卡/8 关/8 舞台/STATUS_INFO/UPGRADE_DEFS/BUILD_DEFS/ABILITY_DEFS/ shopPrice/CONTROLLED_SHOP。
- src/dlc/engine.ts：createBattle(def,deck,seed,stats,enemyPlays,builds,abilities)/playerPlay/endPlayerTurn/tutorDraw/spendHeal/exhaustCard。状态分类：永留(serotonin/dissociation/counter/analgesia) vs 回合制(sedation/respiratory/delirium 折半, motivation -1)。
- src/dlc/store.ts：zustand，odw.dlc.v1 独立存档；recordWin/buyCard/buyUpgrade/buyBuild/activateAbility/drawGacha(池+保底)。
- src/dlc/gacha.ts：4 池/概率/保底(10精二,30精一麻,歪保底)。
- src/dlc/story.ts：独立 VN（interlude-1..8 + tail），不接主线引擎。
- 页面：DlcCoverPage(封面+开场)/DlcCampaignPage/DlcBattlePage(含无尽 endless prop)/DlcShopPage(商店/牌组/抽卡/强化/流派/激活)/DlcStoryPage/DlcEndingPage。
- 组件：HarukazeBust(差分立绘)/CardDetail(长按详情,portal+fixed)。
- 开场：src/openings/dlc.ts + registry CANVAS_OPENINGS.dlc，封面点进入播放。

## 关键约定（必须遵守）
- 基调：纪念/减害，不殉道化；无合成/配方/剂量。角色心理侧写在 设计文档/重写文本/人物心理侧写/。
- 玩家增益（属性/流派/激活）只给玩家，绝不泄漏敌方（有 dlc-noleak.test.ts 锁定）。
- 私有美术留本地惯例已改：运行所需资源要入库（build:private 用于 Pages）。
- i18n：messages.zh.ts 为源（as const），en 对照。
- 音乐署名「音乐由[乌鸦Producer]提供」；check-audio ≤4.5MB/cue。
- 立绘生成 tools/qwen_image.py（凭证在仓库外 .env.local）+ pixelize.py。星头无脸。

## 如何加新 DLC《未曾翻开的自我》
现有 src/dlc 是稍尽春风专用。新 DLC 两条路：
1. 抽象多 DLC框架：把 content/story/save 键按 dlcId 参数化（改动大）。
2. 平行模块 src/dlc2 + 页面复用战斗引擎/UI，新内容/新角色/新存档键（推荐，隔离清晰）。
新会话先定角色/主题/机制差异，再选路。复用 engine/战斗UI/抽卡/强化/激活系统，换内容+立绘+剧情+音乐。

## 验证流程
npm test / npx tsc --noEmit / npm run build:private / node tools/verify-*.cjs（Playwright, executablePath /root/.cache/ms-playwright/chromium-1255/chrome-linux-arm64/chrome, --no-sandbox, waitUntil load）。
出包：git tag v2.x && git push origin v2.x（SSH deploy key ~/.ssh/odw_deploy）。
装机：APK 下载→cp /data/local/tmp→pm install（Shizuku 确认）或用户手动装。
