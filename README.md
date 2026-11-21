# Overdose Wiki

像素维基、复演与药箱构筑组成的视觉小说前端。完整剧情、美术、音乐和代码都随本仓库公开。

## 运行

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm test           # Vitest
npm run e2e        # Playwright（先 npx playwright install）
npm run build      # sample demo
npm run build:private  # 完整游戏（当前公开部署使用这个）
```

## 当前状态

- 480×270 逻辑画布，自动取 1–4 整数倍。
- 章节、报告、复演、档案、效果、药箱、番外、历史、讨论均已接入。
- 章节/报告/效果按需加载；章节/报告/散页解锁门槛；音频管理器、BGM/SFX、弹层焦点陷阱、报告段切换、字体+/高对比、480/960/1440 视觉回归。
- 战斗系统暂时归档到 `hidden/battle/`，不参与构建；`/battle/:id` 重定向首页。
- 像素字体使用 Fusion Pixel 8/10/12 与 Cubic 11，字体子集约 254KB。
- `npm run content:check` 检查场景图、断链和缺字段。

## 目录

```text
src/app       路由、窗口壳、缩放、知情守卫
src/ui        窗口/维基/复演/构筑组件
src/game      存档、设置、路由辅助、历史、牌组校验
src/content   schema、sample 与完整游戏内容
src/styles    tokens/base/motion
src/pages     各路由页面
tests/e2e     Playwright
hidden/battle 战斗归档，不参与编译与打包
```

## 内容与构建

`src/content/private/` 是历史命名，现在存放完整剧情、报告和效果；这些内容随公开仓库发布。`src/content/sample.ts` 是公开 sample。

- `npm run build:private`：完整游戏，当前 GitHub Pages 使用这个
- `npm run build`：sample demo，只用于公开示例

## 战斗归档

战斗系统暂时下线，页面、引擎和测试在 `hidden/battle/`，不参与 `tsc` 与构建；牌组校验保留在 `src/game/deck.ts`。恢复步骤见 `hidden/battle/README.md`。

## 部署

GitHub Pages 构建流程在 `.github/workflows/pages.yml`，完整步骤见 `DEPLOY.md`。

```bash
npm run build:private
npm run deploy:check
```

地址：https://inline-function.github.io/Overdose-Wiki/

`public/_headers` 是给支持该格式的托管商用的；GitHub Pages 不读取它。`public/robots.txt` 禁止索引。

## CI

`.github/workflows/ci.yml` 在每次 push 到 `main` 和 PR 时运行：

```text
npm ci
npm run typecheck
npm test
npm run content:check
npm run build:private
npm run deploy:check
```

## 字体

像素字体使用 **Fusion Pixel 8/10/12**（OFL，Fontsource 完整字库），16/18px 标题使用 **Cubic 11**（OFL）。字体与许可证在 `public/fonts/`，完整字库在 `fonts-src/`。

`tools/subset-fonts.py` 从 `src/` 收集全部用字，并补齐 GB2312 常用汉字；字数增删后必须重跑。`tools/build-font-patch.py` 为缺字生成同网格补丁字体。`npm run fonts:check` 可检查用字覆盖率。

## 音频

BGM 使用 **乌鸦Producer 的免费商用音乐包**，共 17 个 cue，转码为 128kbps MP3，放在 `public/audio/bgm/`。原始 WAV 不入库；`tools/audio/audio-map.json` 记录源文件与 cue 的映射，`npm run audio:build` 可重新转码，`npm run audio:check` 会检查缺失/超限文件。

入口与加载界面的按键声、进度滴答、盖章与故障噪声由 `src/audio/gateAudio.ts` 用 Web Audio 实时合成，不需要额外音频文件；受浏览器自动播放限制，首次点击/按键后才启用。

**音乐由[乌鸦Producer]提供**。署名同时出现在设置页与 README；不得转售该音乐包。

## 许可证

- 代码、剧情、章节/报告数据、原创美术、药圈内战音效：**MIT**，见 `LICENSE`
- 乌鸦Producer 的 BGM：免费商用授权，需署名，**不属于 MIT**
- 字体：SIL OFL 1.1，**不属于 MIT**

第三方素材与完整署名见 `NOTICE.md`。
