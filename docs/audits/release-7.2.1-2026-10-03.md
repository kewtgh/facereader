# FaceReader 7.2.1 — 声明页与依赖更新

## 页面与版本说明

- `/THIRD_PARTY_NOTICES/` 改为专用 Jekyll layout，保留 URL。
- 使用本站现有字体、配色与横向边界，分别展示 FaceReader 当前版本和 Minimal Mistakes 4.28.0 上游基线。
- 站点版本从 `_data/theme.yml` 读取，移除过时的 6.9.5 硬编码；支持中英文 UI 和手机单列布局。
- 原始主题 LICENSE 不变；补充 jQuery 与 Magnific Popup 的署名和许可链接。

## 已执行的稳定版更新

| 依赖 | 原版本 | 更新版本 |
| --- | --- | --- |
| Node.js LTS 项目配置 | 24.18.0 | 24.21.0 |
| jQuery | 3.6.0 手工副本 | 4.0.0 npm 锁定 |
| Magnific Popup | 1.1.0 手工副本 | 1.2.0 npm 锁定 |
| algoliasearch（构建/索引客户端） | 5.55.2 | 5.59.0 |
| yaml | 2.9.0 | 2.9.1 |
| instantsearch.js（浏览器 CDN） | 4.106.0 | 4.119.0 |
| instantsearch.css（浏览器 CDN） | 8.18.0 | 8.24.0 |
| jekyll-default-layout | 0.2.0 | 0.2.1 |
| jekyll-feed | 0.17.0 | 0.18.0 |
| jekyll-include-cache | 0.2.2 | 0.3.1 |
| jekyll-optional-front-matter | 0.3.3 | 0.3.4 |
| jekyll-redirect-from | 0.16.0 | 0.17.0 |
| jekyll-seo-tag | 2.9.0 | 2.9.1 |
| jekyll-titles-from-headings | 0.5.4 | 0.5.7 |
| listen | 3.10.0 | 3.10.1 |
| sass-embedded（Windows / Linux 锁文件） | 1.105.0 | 1.105.1 |

Magnific Popup 1.2 已移除旧插件对 `jQuery.isArray` / `jQuery.isFunction` 等 API 的依赖，保留原有弹窗外观和文章链接。删除旧手工复制的两个 JS 文件；历史文件仍可从 Git 恢复。Rake 使用独立参数调用本地压缩器，避免 Windows 将许可注释正则中的 `|` 当成命令管道。

视觉回归另外发现图片弹窗的层级低于手机浮动目录/回到顶部按钮；已调整弹窗遮罩与内容层级，并增加回归断言。

## 保留与兼容性决定

- Jekyll 4.4.1 和 UglifyJS 3.19.3 已是查询时稳定版，不需修改。
- Minimal Mistakes 4.28.0 是本站定制的来源基线，不应因依赖更新而改写。
- 浏览器 Algolia 4.27.0 保留原 API；构建端 Algolia 5.59.0 的 A/B Testing V3 变动不涉及本站使用的索引 API。
- Liquid 5、Rouge 5、JSON 3、Octokit 10、html-pipeline 3 等不强行突破 Jekyll / 插件约束。没有采用预发布版，也不升级系统全局 Ruby/Node 安装。

## 官方来源

- [jQuery 4.0 说明](https://blog.jquery.com/2026/01/17/jquery-4-0-0/)
- [Magnific Popup 1.2 发布说明](https://github.com/dimsemenov/Magnific-Popup/releases/tag/1.2.0)
- [Algolia 发布说明](https://github.com/algolia/algoliasearch-client-javascript/releases/tag/5.59.0)
- [YAML 发布说明](https://github.com/eemeli/yaml/releases/tag/v2.9.1)
- [InstantSearch 发布说明](https://github.com/algolia/instantsearch/releases)
- [Node.js 24.21.0 LTS](https://nodejs.org/en/blog/release/v24.21.0)

## 验证

验证覆盖 Jekyll 构建、完整 `site:check`、Chromium 1243 的 1440/1024/390px 页面回归、中英文声明页、桌面/手机图片弹窗、前后切图、Escape 与焦点恢复。搜索成功路径使用真实 CDN 脚本与模拟结果，不能修改或查询线上索引。

截图输出：`tmp/audit-2026-10-03/notices-1440.png`、`notices-390.png`、`notices-en.png`、`lightbox-1440.png`、`lightbox-390.png`。

执行结果：

- `npm run site:build`：通过。
- `npm run site:check`：通过；既有内容复核提示保留。
- Chromium 1243 `npm run site:browser`（含 `FR_TEST_SEARCH_CDN=1`）：通过，未捕获浏览器异常。
- `npm audit` / 安装后的审计：0 项漏洞。
- Algolia 索引/密钥方法与 YAML 配置解析的无网络兼容检查：通过。
- 最终 CSS：197844 bytes，gzip 34644 bytes，Brotli 29012 bytes，预算检查通过。
- 最终生成 HTML：245 页、944 张图片；没有图片尺寸/加载属性问题。

搜索测试曾因将 Algolia 的 JSON 请求按表单解析而失败；修正测试拦截器后，成功显示模拟文章结果，不需要改动网站搜索业务逻辑。

既有 LEADERS 数据复核提示不在本次范围内；更新依赖不等于重新验证这些评分内容。未添加下载功能，未推送或部署。
