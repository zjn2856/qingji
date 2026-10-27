# 轻记 QingJi

一款为 iPhone 设计的、完全离线优先的个人记账 PWA。无需账号、服务器或付费服务；所有账本数据只保存在当前浏览器的 IndexedDB 中。

## 功能

- 收入/支出记账、两位小数金额校验、JPY 零小数位支持
- 默认与自定义分类、分类改名；有关联账单的自定义分类安全归档
- 首页月度收支、结余、每日趋势、分类占比、最近账单
- 按月份、类型、分类、备注筛选，查看、编辑和二次确认删除
- 独立月度统计、收支对比和分类排行
- 完整 JSON 导出、严格校验、确认后事务化覆盖恢复
- 本地账本名称与货币设置；修改货币不会自动换算历史金额
- Manifest、Apple Touch Icon、Service Worker 预缓存和离线启动
- iPhone 安全区域、软键盘、底部弹层、44px 触控区域适配

## 技术选择

React 19 + TypeScript + Vite；`idb` 封装 IndexedDB；`lucide-react` 提供打包到本地的图标；`vite-plugin-pwa` 生成 Manifest 和 Service Worker。金额始终使用整数最小货币单位计算。没有路由器、在线 CDN、远程字体、分析 SDK、云数据库或后端。页面通过 URL hash 切换，因此 GitHub Pages 刷新不会 404。Vite `base: './'`、相对 Manifest `start_url`/`scope` 支持仓库子路径。

## 一、Mac 本地运行

### 1. 安装 Node.js

推荐安装 Node.js 22 LTS 或更新版本：

1. 打开 <https://nodejs.org/> 下载 macOS LTS 安装包并安装；或已安装 Homebrew 时运行 `brew install node@22`。
2. 打开“终端”，确认：

```bash
node --version
npm --version
```

### 2. 安装依赖

在项目目录执行：

```bash
npm install
```

### 3. 启动开发环境

```bash
npm run dev
```

终端会显示本地地址，通常为 `http://localhost:5173`。开发模式用于功能开发，不等同于已安装的离线 PWA；离线验证请使用生产构建。

### 4. 执行自动化测试

```bash
npm test                 # Vitest：金额、日期、统计、CRUD、备份与回滚
npx playwright install chromium
npm run test:e2e         # iPhone 尺寸 Chromium：UI、持久化、备份、离线
npm run typecheck        # TypeScript 严格检查
npm run build            # 生产构建
```

Playwright 测试基于 Chromium 的 iPhone 设备参数，不是真实 iPhone Safari。端到端测试自动启动生产预览。

### 5. 构建生产版本

```bash
npm run build
npm run preview
```

产物在 `dist/`，包含静态资源、Manifest、图标和 Service Worker。不要直接用 `file://` 打开，PWA 需要 HTTP/HTTPS 环境。

## 二、免费部署到 GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`，推送到 `main` 后自动测试、构建并部署，无需密钥、域名或服务器。

### 6. 创建 GitHub 仓库

在 GitHub 网页新建一个空仓库，例如 `qingji`。不要添加包含私人账本的文件；本项目的测试和源码不含真实账单。

### 7. 推送代码

在 Mac 终端进入项目目录，将下面的 `YOUR_NAME` 替换为 GitHub 用户名：

```bash
git init
git add .
git commit -m "Initial QingJi PWA"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/qingji.git
git push -u origin main
```

如果 GitHub 要求登录，请按 GitHub 官方提示使用凭证管理器或个人访问令牌；不要把令牌写进项目。

### 8. 开启 GitHub Pages

进入仓库 **Settings → Pages**，在 **Build and deployment → Source** 选择 **GitHub Actions**。随后打开 **Actions**，等待 `Build and deploy to GitHub Pages` 工作流成功。若首次没有自动运行，可在 Actions 页面手动选择 **Run workflow**。

### 9. 获取 HTTPS 地址

部署完成后地址通常为：

```text
https://YOUR_NAME.github.io/qingji/
```

准确地址以仓库 Settings → Pages 或 Actions 部署结果为准。相对资源路径已经适配 `/qingji/` 子目录。

## 三、iPhone 安装与离线验收

### 10–11. Safari 打开并添加到主屏幕

1. 用 iPhone 的 **Safari** 打开上面的 HTTPS 地址，等待首页完整加载。
2. 点击 Safari 底部分享按钮。
3. 选择 **添加到主屏幕**，名称保持“轻记”，点击“添加”。
4. 从主屏幕图标启动，应用以 standalone 模式显示。

首次加载和安装必须联网。iPhone 上请通过 Safari 添加，而不是其他浏览器的普通书签。

### 12. 飞行模式离线验证

1. 安装后先在线打开一次，确认资源加载完成。
2. 添加一笔测试账单，回到首页确认统计更新。
3. 完全退出轻记，再开启飞行模式。
4. 从主屏幕重新打开轻记，新增、查询、编辑、删除和查看统计。
5. 关闭飞行模式后，数据仍只在本机，不会自动上传或同步。

## 四、备份与恢复

### 13. 导出 JSON

1. 打开 **设置 → 导出备份**。
2. Safari/系统出现下载或分享界面后，将文件保存到“文件”App、iCloud Drive 或其他安全位置。
3. 文件名类似 `轻记备份-2026-10-27.json`，包含全部账单、分类和设置。

导出只读取数据库，不会修改或删除账本。iCloud Drive 只是你手动选择的备份保存位置，不代表应用自动同步。

### 恢复 JSON

1. 打开 **设置 → 导入恢复**，从“文件”App 选择轻记 JSON。
2. 应用先检查 JSON、schemaVersion、字段类型、金额、日期、重复 ID 与分类关联；无效文件会被拒绝。
3. 页面显示账单数量、导出时间与覆盖说明。确认 **覆盖并恢复** 后才会执行。
4. 恢复在一个 IndexedDB 事务中完成，失败会中止并保留旧数据；成功后所有页面和统计刷新。

**覆盖恢复不可撤销。操作前建议先导出当前账本。**

## 数据与隐私说明

- 数据存储在当前浏览器/主屏幕 Web App 的 IndexedDB，不是 GitHub Pages 或云端数据库。
- 卸载应用、删除网站数据、清理 Safari 存储或系统回收网站数据，均可能造成本地数据丢失。
- 不承诺 iCloud 自动同步。请至少每月手动导出备份，重要变更后立即备份。
- 更新 PWA 不会主动清空 IndexedDB；新版本会提示更新，不会在填写账单时强制刷新。
- Service Worker 只预缓存构建静态资源，不拦截或缓存用户导出的备份文件。

## 数据结构与维护

数据库 `qingji-ledger` 当前版本为 1：

- `transactions`：UUID、类型、`amountMinor`、分类、YYYY-MM-DD、本地备注、创建/修改时间；含日期、类型、分类和类型-日期索引。
- `categories`：唯一 ID、名称、类型、图标、颜色、默认/归档状态、创建时间。
- `settings`：键值设置。

数据库操作集中在 `src/lib/db.ts`，备份校验在 `src/lib/backup.ts`，金额和日期分别在 `src/lib/money.ts`、`src/lib/date.ts`。未来数据库升级应提升版本并编写增量 `upgrade` 迁移，不能删除旧库。

## 验证范围

2026-10-27 在 Windows、Node.js 24 与本机 Chrome 中实际执行：

- Vitest：5 个测试文件、30 项测试全部通过。
- Playwright：4 项生产环境端到端测试全部通过，覆盖新增收支、编辑、删除、分类/备注筛选、月份、导出、导入、无效文件、刷新持久化、Service Worker 注册与离线刷新后记账。
- `npm run build`：TypeScript 检查、Vite 构建、PWA 资源生成全部成功，预缓存 13 项本地资源。
- 另已检查 iPhone 13 尺寸的完整首页截图和浏览器控制台，无控制台错误。

**尚未通过真实 iPhone Safari 真机验证，也尚未执行 GitHub 线上部署。** 真机需额外确认：主屏幕安装、刘海/灵动岛与 Home Indicator 安全区域、软键盘下保存按钮、文件 App 下载/选择、分享备份、飞行模式冷启动，以及 iOS 对网站存储的系统管理行为。Windows/Linux 的 Chromium 模拟不能替代这些真机检查。
