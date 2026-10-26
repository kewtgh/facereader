# FaceReader 7.8.1：浏览器回归使用实际文章地址

## 问题与审计

[Pages #107](https://github.com/kewtgh/facereader/actions/runs/40388016174/job/121801331229) 在 `Validate browser behavior without external services` 失败。生产构建、静态检查和 Chromium 安装均已通过；浏览器回归在数学公式检查中等待 `.katex-display` 超过 30 秒。

英文芬兰文章的分类由 `Society` 改为 `Social Commentary`，Jekyll 根据分类生成的地址随之改变。测试仍访问 `/society/Society-lcer-finland-en/`，进入 404 页面后等待不存在的公式；原导航助手没有先检查 HTTP 状态。这是测试样本地址过期，不是 KaTeX 渲染失败，也不是外部服务不可用。

当前提交的干净生产构建确认新地址存在、旧地址不存在。使用修改前的完整浏览器脚本在本地复现了相同的第 174 行超时；证据位于忽略目录 `tmp/actions-browser-2026-10-27/baseline-browser.log`。

## 修改计划

1. 从本次构建的 `category-index.json` 按稳定的文章 slug 解析样本 URL，分类不再写死在数学、注释及文章工具栏样本地址中。同一文章出现在多个分类时去重，缺失或歧义样本立即报错。
2. 主回归导航助手先验证 HTTP 200；数学检查先确认本地渲染器已启用，继续保留原公式内容、数量、MathML、脚注公式和窄屏溢出断言。
3. 保持 Actions 中的完整浏览器验证步骤和外部请求阻断，使用当前文章内容完成生产构建、静态检查及 Windows/Linux 浏览器回归。
4. 更新说明和版本至 7.8.1，保存验收证据并本地提交。

## 验收结果

以上 4 项计划均已完成。

- 当前内容的生产构建与完整 `site:check` 通过：258 个 HTML、1499 处图片引用，0 个图片尺寸或加载属性问题，站内链接检查通过；119 篇文章、5 个受爬虫规则保护的公开 JSON 和私有搜索产物边界检查通过。
- Playwright 1.64.1 / Chromium Headless Shell 1248（156.0.8078.4）分别在 Windows 和 Linux 临时容器完成完整浏览器回归，均返回退出码 0；没有使用 `FR_READING_ONLY` 或放行外部搜索服务。
- 原失败的中英文芬兰数学公式检查通过，包括桌面及 390px、行内及块级公式、MathML 和脚注公式；阅读列表与工具栏的中英文 320–1440px 布局、分类、标签、目录、脚注、错误重试及发布边界检查通过。
- 原有数学内容断言和 Actions 验证步骤全部保留，没有通过延长超时或跳过检查处理错误。复核了英文移动端公式截图。
- 本地 `_site` 的 623 个文件与已验证的生产产物逐一进行 SHA-256 比对，完全一致；原预览保存在同一证据目录的 `previous-site/`。

证据保存在 `tmp/actions-browser-2026-10-27/`：`build.log` 为修复前的当前内容构建、`baseline-browser.log` 为复现失败、`build-final.log` 为 7.8.1 构建及完整检查、`browser-windows.log` / `browser-linux.log` 为最终浏览器验收，截图位于 `windows-screenshots/` 和 `linux-screenshots/`，产物比对见 `artifact-copy.log`。

本次只本地提交，没有推送、部署或真实 Algolia 写入。远端失败记录仍对应旧提交，新修复需要推送后由 Actions 验证。
