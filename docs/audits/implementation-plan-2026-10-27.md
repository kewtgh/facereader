# FaceReader 7.8.0 修改与验收计划

日期：2026-10-27。对应审计：`project-audit-2026-10-27.md`。

## 执行顺序

| 阶段 | 对应发现 | 交付及验收条件 |
| --- | --- | --- |
| P01 | A01–A03 | robots 禁止根目录、嵌套及带参数 JSON；Algolia 记录移至 `tmp/build/algolia-records.json`；公开目录无构建记录、未启用的 Lunr 备用索引及重定向 JSON；CI 私有上传、下载、推送路径一致 |
| P02 | A04–A06 | 统一可见性、语言与分类目录；分类精选/计数/详情同步语言；无该语言文章有明确状态；重复 slug、隐藏/未来内容、安全路径和错误响应有验证 |
| P03 | A07 | 搜索同步先完整预检配置和记录；验证 `*` / `**`、空集、重复 ID、非法 URL 及错误配置；实际网络写入不参与验收 |
| P04 | A08 | 在阅读列表下方加入轻量备份与恢复入口；导出文件仅在本地生成；导入合并、去重、不覆盖现有收藏，超限/格式错误/过大文件及不可用存储有明确提示；中英文及窄屏保持一致 |
| P05 | A09 | 单一 HTML robots meta；JSON/私有产物策略进入 `site:check`；CI 验证新产物边界；README 解释发布与 Google 更新范围 |
| P06 | 依赖及发布 | 核实稳定依赖与 LTS；生产构建、完整 `site:check`、完整浏览器回归、320–1440px 双语截图复核；保存证据，更新 7.8.0 并本地提交 |

## 保留行为

- 全站搜索保持唯一文章搜索入口；不恢复独立搜索页和页脚隐私设置。
- 主站、分站、匿名社交链接和双语 Feed 保持既有策略。
- 文章顶栏布局、阅读列表存储键和旧数据兼容；本地导入不要求账号，不发送文件内容到服务器。
- 不降低现有 CSS 预算、静态检查或浏览器门禁，不用生产写入验证离线可验证的逻辑。

## 验收结果

所有阶段均已完成，版本为 **7.8.0**。

| 阶段 | 实际结果 |
| --- | --- |
| P01 | 完成。通用规则覆盖根目录、嵌套目录及查询参数 JSON；5 个必要运行数据文件均经验证禁止抓取。公开目录不含 Algolia 同步记录、redirects.json 或 Lunr 备用索引；117 条搜索记录仅保存在私有构建产物，CI 上传及下载路径一致。 |
| P02 | 完成。分类精选、目录计数、详情使用相同语言；英文页面隐藏没有英文文章的主题卡片，当前分类无该语言文章时显示说明。错误记录/不安全路径不会生成卡片，可重试恢复；隐藏、未来文章、slug 冲突及公开标签策略均有验证。 |
| P03 | 完成。递归 glob、空输入、全部排除、重复 URL、畸形元数据、错误来源 URL 和 UTF-8 记录预算通过离线验证；预检发生在创建 API 客户端和替换索引之前。 |
| P04 | 完成。导出、导入合并、保留原收藏、去重、跳过失效文章、损坏文件、外部 URL、100KB、100 篇上限、禁用和只读存储均通过；没有文件上传。原存储键和列表宽度保持兼容。 |
| P05 | 完成。HTML robots meta 唯一，归档前后页 SEO 链接正确；站点检查持续验证 JSON、sitemap、私有产物、CI 路径与版本。修改涉及的模块和分类数据会传递入口版本参数，模拟旧依赖及旧分类数据缓存仍能正常启动新功能。 |
| P06 | 完成。生产构建、完整 site:check、最终完整 Chromium 回归及截图复核通过；本地预览已更新并与验收产物逐文件比较，交付本地 Git 提交。 |

### 依赖核实与更新

| 项目 | 最终版本或变更 |
| --- | --- |
| Node / npm | 24.22.1 LTS / 12.2.1；从官方 Node 发布索引和 npm 注册表确认，保留现有运行时文件。 |
| Ruby / Bundler / RubyGems | 4.0.9 / 4.0.23 / 4.0.23；保留稳定版本。严格兼容范围内的 bundle outdated 最终无更新项。 |
| KaTeX | 0.19.0 → 0.19.1；锁文件、本地 JS/CSS、版本文件和许可说明同步。 |
| Faraday | 2.15.0 → 2.15.1；由 Bundler 解析并更新版本及官方校验和。 |
| InstantSearch.js / CSS | 4.120.0 → 4.121.0 / 8.24.1 → 8.25.0；保留 Satellite 主题，使用新固定 URL 的真实库和样式完成模拟请求验证。 |
| ruby/setup-ruby | v1.334.0 → v1.335.0；其余已使用的 GitHub Actions 固定版本经官方发布 API 核实无需变更。 |
| 其他 | npm 直接依赖、Playwright 1.64.1、Font Awesome 7.3.1、上游 Minimal Mistakes 4.28.1 已核实稳定版本；不采用预发布版本，不强装超出 Jekyll 兼容约束的主版本。 |

来源：[Node 发布索引](https://nodejs.org/dist/index.json)、[Ruby 官方发布](https://www.ruby-lang.org/en/news/)、[KaTeX 注册表](https://registry.npmjs.org/katex/0.19.1)、[Faraday](https://rubygems.org/gems/faraday/versions/2.15.1)、[InstantSearch.js](https://registry.npmjs.org/instantsearch.js/4.121.0)、[InstantSearch.css](https://registry.npmjs.org/instantsearch.css/8.25.0)、[ruby/setup-ruby](https://github.com/ruby/setup-ruby/releases/tag/v1.335.0)。

### 验证结果与证据

- 生产输出：256 个 HTML，1487 处图片引用，0 个尺寸问题、0 个加载属性问题；站内链接及生成 HTML 审计通过。
- 样式：209125 bytes raw / 36582 gzip / 30558 brotli，保持原 36864 bytes gzip 预算；无 Sass 弃用警告。
- 内容策略测试：6 runs / 30 assertions；系列 2 / 12、语言归档 2 / 23；全部通过。
- npm 已知漏洞审计：0；新依赖经干净安装验证，Ruby 兼容更新检查为 0。
- 完整浏览器覆盖已有及新增功能，中英文、320/390/768/1024/1440px 的阅读列表与工具栏几何保持正确；分类、搜索、目录、数学公式、注释、LEADERS、无 JS 回退及错误重试均通过，0 个未捕获脚本异常。
- 桌面、390px、320px 截图已复核：备份入口与现有列表相容，英文分类页优先呈现实际可读的内容，没有横向溢出。
- 本地预览的 621 个文件与验收产物 SHA-256 一致；旧预览保存在 tmp/audit-2026-10-27/previous-site/。

完整检查日志为 tmp/audit-2026-10-27/release-validation.log，最终生产产物检查为 production-accepted.log，最终浏览器日志为 browser-accepted.log。截图在 screenshots/，不可公开的搜索产物、npm-audit.json、gem-outdated.txt、npm-latest.json、cdn-latest.json、action-latest.json、runtime-latest.json 和 artifact-copy.log 均保存在同一忽略目录中。最终预览来源为 verified-site/，避免混入旧构建遗留文件；纯静态分类加载脚本的版本参数更新与源码逐字一致，纳入最终浏览器回归。

### 发布边界

本次仅本地提交，没有推送、部署、真实 Algolia 索引写入、统计发送、评论提交或付费服务调用。只读版本核实访问官方注册表与发布 API。搜索回归使用固定版本的真实客户端库和模拟响应，浏览器的其他外部请求均阻断或模拟。

原有 LEADERS 内容事实复核提示保留；工程验证不代替企业事实复核。hidden 表示不在公开目录、推荐、搜索和 sitemap 中分发，不是访问权限机制。

部署后应检查线上 robots.txt 已含两条 JSON 通配规则、category-index.json 仍供浏览器正常读取、algolia-records.json / redirects.json / Lunr 备用索引不再公开。Google 需要重新读取部署后的规则；禁止抓取不承诺立即删除已知 URL 或 Search Console 历史记录。主站/分站架构和刻意保留的匿名社交链接未调整。
