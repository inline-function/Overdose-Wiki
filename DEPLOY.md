# 公开部署：GitHub Pages

仓库：https://github.com/inline-function/Overdose-Wiki

完整版通过 GitHub Pages 发布，构建完整内容，不使用 Access 或密码。

## 1. 开启 Pages

1. 打开仓库 **Settings** → **Pages**。
2. **Build and deployment** → **Source** 选择 **GitHub Actions**。
3. 不需要手动选择分支或目录。

## 2. 触发部署

推送 `main`，或在 **Actions** 里手动运行 **Deploy GitHub Pages**。

工作流会执行：

```text
npm ci
npm run build:private
npm run deploy:check
```

然后把 `dist/` 上传为 Pages artifact。

## 3. 地址

```text
https://inline-function.github.io/Overdose-Wiki/
```

首次部署后 Pages 可能需要一两分钟生效。

## 4. 本地验证

```bash
npm run build:private
npm run deploy:check
```

`deploy:check` 会确认：

- `dist/index.html` 存在
- `dist/assets-private/` 存在
- 背景、效果和 `drug-war.wav` 存在
- `dist/robots.txt` 存在

## 5. 注意

- 公开部署使用 `npm run build:private`，不是 `npm run build`。后者是 sample demo，会删除完整内容。
- 完整剧情、报告和美术会公开；`src/content/private/_backup/` 没有进入这个仓库。
- `public/_headers` 不会被 GitHub Pages 读取；CSP 等响应头需要换到 Cloudflare/Netlify 才能生效。
- 音乐和字体仍按 `NOTICE.md` 的单独授权声明，不属于 MIT。
