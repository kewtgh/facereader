# FaceReader 完整整改与功能计划（2026-10-24）

对应 [审计](project-audit-2026-10-24.md)。目标版本 **7.7.0**；下列 13 项均为本次实施范围。保留静态博客架构、主站与分站、手动语言优先的时区默认、现有分页和文章地址，执行本地提交。分站不做专项处理，现有域名和授权配置继续保留。

## 实施顺序与验收

|阶段|内容|完成标准|
|---|---|---|
|P01 / A01|修复产物边界|根目录脚本、部署配置、审计文档、研究和测试产物不出现在 `_site`；构建审计持续检查。|
|P02 / A02|建立统一内容策略与相关推荐|归档、目录、推荐使用一致的语言和可见性判断；推荐最多 4 篇，同语言、无自身/翻译重复；单元测试覆盖隐藏、未来、缺少 locale 和排序。|
|P03 / A03|修复阅读时长|生成一次混合语言估算；尊重正数配置、向上取整、最少 1 分钟；中英文及混合文本测试通过。|
|P04 / A04|本地双语文章搜索|新增页面与精简 JSON 目录；关键词/主题/语言/清除/URL 深链接/返回前进/请求重试均可用；不依赖外部库或请求；外部搜索错误可转入本地搜索。|
|P05 / A05|稍后阅读|文章页明确保存；列表可读、移除和跨标签同步；条数有限、异常存储不崩溃、不能注入外链或 HTML；双语手机/桌面可用。|
|P06 / A06|统计选择与按需评论|首次访问不请求 GA/Disqus；明确启用统计才加载，撤回后停止下一次页面加载；隐私信号优先；评论点击才请求并支持失败重试；双语隐私说明与行为一致。|
|P07 / A07|分语言订阅|`/feed/zh.xml` 与 `/feed/en.xml` 仅含相应语言的可见文章，Atom XML 可解析且条目去重；原统一 RSS 可继续使用。|
|P08 / A08|日期元数据|修复已确认的 5 处错误，增加 ISO 日期/时间校验；不改日期含义和正文。|
|P09 / A09|旧 sitemap 兼容|`/site.xml` 使用正式域名引用自动 sitemap；既有访问入口保留。|
|P10 / A10|404 与导航|双语 404 有实际搜索/首页/归档链接；新增功能有站内入口；修复 320px 页眉溢出和搜索点击区；按用户要求保留匿名社交入口。|
|P11 / A11|发布验证可复现|声明锁定 Playwright，CI 在上传前执行 Chromium 回归；截图目录可设置；已有部署脚本从 `.node-version` 读取 Node；本地完整检查与浏览器检查通过，保留实际结果。|
|P12 / A12|正文阅读进度|只在文章显示，正文结束时完成；目录、推荐、评论和页脚不改变阅读完成度；布局变化仍更新。|
|P13 / A13|最新稳定依赖与 LTS|核实官方最新稳定版本；运行时优先 LTS；更新清单、锁文件、CDN、部署脚本和文档；记录受 Jekyll 依赖图限制的兼容版本；在升级后重跑全部检查。|

## 验证和交付

1. 实施内容策略与搜索逻辑的针对性单元测试，再以 production 模式重建；本地使用无权限占位密钥。
2. 运行 `npm run site:check`，检查评分、系列、归档、双语元数据、Actions、Sass、CSS 预算、链接和公开产物。
3. 运行完整 Chromium 回归，补充新功能、首次第三方请求为零、失败重试、存储损坏/拒绝、跨标签同步、键盘操作、URL 状态、中英文与 320/390/1024/1440px 视口验证；外部请求阻断或模拟。
4. 视觉检查新搜索、稍后阅读、404、页脚偏好、文章保存按钮的桌面和手机截图；CSS 保持既有 36 KiB gzip 预算。
5. 更新 `package.json` 和锁文件到 7.7.0，让现有构建自动同步版本展示及缓存参数。更新 README 与本计划执行记录，审查 diff 后提交本地 Git。

不执行推送、部署、线上索引写入或付费调用。实际 CI 执行及真实第三方系统行为只有发布后才能验证，不能从本地通过推断。

## 执行记录

审计和计划已在实施前保存，并按用户补充保留分站与匿名社交入口，加入稳定依赖升级。源代码整改已完成，最终验证结果在下方记录。

### 依赖核实与更新

版本来源为当日官方发布记录、npm 注册表、RubyGems 解析结果及原项目发布标签。Node 26 仍为 Current，按要求使用 Node 24 的最新 LTS 补丁。

|组件|本次采用版本|说明|
|---|---|---|
|Node.js|24.22.1 LTS|同步 `.node-version`、`.nvmrc`、package engines 和部署脚本。|
|Ruby|4.0.9|10 月 23 日发布的稳定版；`.ruby-version`、Gemfile、gemspec、lockfile 和 CI 对齐；Windows 安装包尚为 4.0.7，使用隔离 Linux 环境验证 4.0.9。|
|npm|12.2.1|`.npm-version`、packageManager、engines、CI 与已有安装脚本对齐。|
|Bundler / RubyGems|4.0.23 / 4.0.23|锁文件与校验和、CI、已有安装脚本及验证环境同步。|
|Algolia SDK|5.60.0|Node SDK、浏览器 CDN、锁文件和浏览器库白名单同步。|
|InstantSearch JS / CSS|4.120.0 / 8.24.1|固定 CDN 版本，使用真实库文件与模拟索引响应验证；不调用实际索引。|
|Sass Embedded|1.106.1|Windows 与 Linux 锁定平台及校验和同步。|
|Faraday / faraday-net_http|2.15.0 / 3.5.0|采用 Bundler 实际解析的稳定兼容更新。|
|Playwright / Chromium revision|1.64.1 / 1248|声明开发依赖，CI 安装其匹配的 headless Chromium。|
|Gumshoe / Smooth Scroll|5.1.2 / 16.1.3|由手工旧副本改为 npm 锁定来源，删除旧副本并重新构建 JS bundle。|
|jQuery FitVids|原项目 v1.2.0 标签|保持 jQuery API；上游该标签的版权头仍写 1.1，保留原版权头和 WTFPL 说明。|
|Minimal Mistakes 基线|4.28.1|逐项合入适用的日期格式、iframe 标题、方向属性、Sass 对比色参数和动画修复，保留 FaceReader 定制及原归属。|
|其他 npm / CDN|jQuery 4.0.0、KaTeX 0.19.0、Magnific Popup 1.2.0、YAML 2.9.1、UglifyJS 3.19.3、Font Awesome 7.3.1、Lunr 2.3.9|核实已是相应组件的最新稳定版。|
|GitHub Actions|checkout 7.0.1、setup-node 7.1.0、github-script 9.0.0、configure-pages 6.0.0、upload-artifact 7.0.2、download-artifact 8.0.2、upload-pages-artifact 5.0.0、deploy-pages 5.0.1、setup-ruby 1.334.0|核实官方最新稳定发布并固定具体版本。|

Jekyll 4.4.1 及插件已经是兼容图中的稳定版本。不能越过上游约束强装 JSON 3、Liquid 5、Rouge 5、terminal-table 4、html-pipeline 3、Octokit 10、Prism 2 和 unicode-display_width 3：分别受 Jekyll、jemoji、jekyll-gist、IRB 和 terminal-table 约束。保留解析器能共同满足的最新稳定版本，避免让“更新”变成不可构建的依赖组合。

来源：[Node LTS 发布](https://nodejs.org/en/blog/release/v24.22.1)、[Node 发布周期](https://github.com/nodejs/Release)、[Ruby 4.0.9](https://github.com/ruby/ruby/releases/tag/v4.0.9)、[RubyInstaller 发布](https://github.com/oneclick/rubyinstaller2/releases)、[Bundler](https://rubygems.org/gems/bundler)、[npm 官方注册表](https://registry.npmjs.org/)、[Minimal Mistakes 4.28.1 变更](https://github.com/mmistakes/minimal-mistakes/compare/4.28.0...4.28.1)、[FitVids v1.2.0](https://github.com/davatron5000/FitVids.js/tree/v1.2.0)。

### 验证范围

隔离验证使用只读源码，生成 Linux Git 检出一致的 LF 文本副本；依赖缓存、生成页面和日志仅写入 `tmp/linux-validation/`。这避免 Linux 直接读取 Windows CRLF 文件时将自动摘要误识别为整篇文章。项目外既有容器和数据没有参与验证，临时验证容器完成后自动删除。

浏览器验证使用 Node 24.22.1 和 Playwright 1.64.1 / Chromium 1248，读取上述 Linux 生产构建产物。默认阻断外部网络；搜索库验证只使用下载的固定版本库与模拟搜索响应，统计、评论请求也使用模拟响应。没有真实索引写入、统计发送、评论提交或付费调用。

### 完成与验收结果

|阶段|结果|
|---|---|
|P01|完成。生成产物没有根目录 `scripts`、部署配置、研究目录、审计文件或 JS source map；构建门禁已覆盖。|
|P02|完成。归档、系列与目录采用统一 locale/可见性规则；推荐排除自身、同翻译组及其他语言，最多 4 篇，按标签和分类关联排序。|
|P03|完成。统一中英文混合阅读估算，覆盖配置、文章覆盖值、无效速率、空内容和取整边界；共用策略测试 3 runs / 19 assertions 通过。|
|P04|完成。本地搜索的关键词、主题、语言、分批展示、深链接、返回/前进、清除、失败重试、无结果及无 JS 入口通过；增强搜索真实库的成功、403 和重试通过，失败关键词保持不变。|
|P05|完成。保存/移除、跨标签同步、损坏存储、禁用存储、去重、外链拒绝、100 篇上限及失效记录手动清理通过。|
|P06|完成。首次访问无 GA/Disqus 请求；模拟同意/撤回、GPC/DNT、存储不可用和评论重试通过。本地搜索/阅读列表不加载统计，其他页面的统计 URL 与 referrer 去除参数和 fragment；展开隐私设置时阅读工具让出操作区域。|
|P07|完成。中文/英文 Atom 分别含 20 / 10 个条目，XML、语言和去重校验通过；原统一 feed 保留。|
|P08|完成。5 处时间格式修正；117 篇文章的双语及日期校验通过。|
|P09|完成。旧 `/site.xml` 为引用主站 canonical sitemap 的合法 index；分站域名和已有搜索授权没有被移除。|
|P10|完成。双语 404、320px 页眉、44px 搜索点击区通过；修正 `[hidden]` 被按钮样式覆盖及减少动态效果时的遗留延迟。桌面/手机截图复核无新增溢出或隐私控件遮挡，匿名社交入口保持原样。|
|P11|完成。Playwright、CI 浏览器门禁、失败截图、版本一致性检查和部署运行时来源同步；Linux production build、完整 `site:check`、最终完整 Chromium 回归均通过。|
|P12|完成。正文结束时进度完成，普通目录/工具页不再显示文章进度；目录、公式、注释及阅读位置原有回归通过。|
|P13|完成。采用上述已核实稳定版本及 LTS；npm 干净安装后 `outdated` 为 `{}`；npm 已知漏洞审计为 0。受上游约束的版本已记录。|

最终生产产物为 **257 个 HTML、1368 张图片**，图片尺寸及加载属性问题均为 0，站内链接和 HTML 审计通过。CSS 为 **207312 bytes raw / 36233 gzip / 30324 brotli**，继续满足原 36864 bytes gzip 预算；累计内联脚本为 31409 bytes。`_site/` 已替换为验证通过的构建，原本地生成目录备份在 `tmp/audit-2026-10-24/previous-site/`。

最终浏览器回归包含旧功能及新功能，覆盖 320/390/1024/1440px、中英文、键盘、无 JavaScript、异常存储、响应失败与重试；0 个未捕获脚本异常。新页面的隐藏状态、减少动态效果及页脚隐私控件已另作视觉复核。

证据保存在不发布的 `tmp/linux-validation/validation.log`、`tmp/linux-validation/npm-outdated.json`、`tmp/audit-npm-security.json`、`tmp/audit-final-browser.log`；截图在 `tmp/audit-2026-10-24/`，包括 `local-search-*`、`reading-list-*`、`404-*`、`article-save-mobile.png`、`privacy-mobile.png`。

既有 LEADERS 内容复核提示保持原样，代码通过不代替评分事实复核。远端 CI、Vercel 实际安装/部署、真实 Disqus 登录评论和线上统计没有执行。本次交付为 **7.7.0 本地 Git 提交**，不推送、不部署。
