# FaceReader 项目与应用审计

日期：2026-10-27。基线：7.7.1，Git `8fba332`。审计目标是让内容可发现、阅读可持续、机器数据与网页内容有清晰的发布边界，并保持静态博客的简单交互。

## 约束与方法

保留主站 `facereader.witbacon.com`、现有分站和刻意匿名的社交链接。不重新引入独立文章搜索、页脚阅读入口或隐私设置。阅读列表继续复用 `/posts/` 的宽度与卡片，保留原存储键和数据。所有 `.json` 均应禁止 robots 抓取；浏览器正常获取运行数据不受此规则影响。

检查了源码、构建插件、CI、生成产物、搜索同步、分类与阅读列表路径。工程验收使用本地生产构建和模拟第三方服务，不进行远端索引写入、统计发送、付费调用、推送或部署。

## 发现与采纳的修复

| ID | 优先级 | 证据及影响 | 修改 |
| --- | --- | --- | --- |
| A01 | P0 | robots 仅有 `/algolia-records.json` 单项规则，未覆盖 `category-index.json`、运行时数据、未来 JSON 及查询参数变体 | 对所有 JSON 路径增加精确的扩展名与查询参数禁爬规则，并自动验证全部实际产物 |
| A02 | P0 | `_site/algolia-records.json` 约 1.8MB，包含文章全文和源路径；CI 同时把它作为搜索同步输入和公开 Pages 内容；未启用的 Lunr 备用索引仍公开约 707KB 内容 | 将同步记录改为构建后的私有产物，脱离 `_site`；同步脚本和工作流使用同一新路径；排除当前 Algolia 站点未使用的 Lunr 资源 |
| A03 | P1 | Jekyll 还生成公开 `redirects.json`，网站阅读不使用该映射 | 关闭冗余 JSON 映射，保留实际 HTML 重定向 |
| A04 | P1 | 分类 JSON、分类计数和精选文章直接遍历 `site.categories` / `site.posts`；语言判断只匹配 `en-US`，漏掉已有 `en` 元数据 | 构建统一的可见分类目录，使用标准化语言；分类精选、目录计数和详情随界面语言同步，明确显示无内容状态 |
| A05 | P1 | 分类 JSON 以 slug 为对象键，没有冲突检查；客户端直接使用记录 URL，错误数据可产生不安全链接；计时请求虽可重试但不校验数据形状 | 为生成目录增加唯一性和字段验证，为客户端增加同源路径及记录校验；保留失败重试和过期响应保护 |
| A06 | P1 | 隐藏文章的默认 sitemap/robots 策略与公开目录过滤分离，未来内容可能从搜索或分类路径泄漏 | 共享可见性策略用于搜索、分类和公开标签；隐藏文章排除 sitemap 并标记 noindex，补充合成边界验证 |
| A07 | P1 | 搜索推送的 `**` glob 转换会被后续 `*` 替换破坏，配置读取失败时继续写远端；空记录缺少拒绝机制 | 修正通配符编译，预检完整记录和配置，空集/畸形记录拒绝推送；纯离线测试，不调用真实写入 API |
| A08 | P2 | 稍后阅读仅保存在浏览器，清理浏览器数据后没有恢复路径 | 增加本地导出/合并导入；严格限制格式、大小、来源 URL、100 篇上限和已发布文章，导入失败不覆盖现有列表 |
| A09 | P2 | head 中有多段可能重复的 robots meta 输出，分页数据缺少 SEO 前后页路径；入口模块有版本参数而依赖和分类数据没有，缓存旧版本可导致新功能启动失败；缺少对 JSON 爬取和私有搜索产物的持续门禁 | 合并 HTML robots 输出，补齐分页路径，让修改涉及的模块和分类数据传递版本参数，增加构建/CI/浏览器回归，并完善运维与 Search Console 说明 |

## 搜索引擎语义

`robots.txt` 控制抓取，不等同于立即删除已知 URL 或清空 Search Console 历史记录。Google 指出被 robots 屏蔽的 URL 仍可能被记录或显示为只有 URL 的结果；被禁爬时，爬虫也读不到页面内的 noindex。这里按用户要求持续禁止抓取全部 JSON，并把构建专用记录从部署产物移除，不能把 JSON front matter 的 `sitemap: false` 误称为 HTTP noindex。

依据：[Google robots 规则与通配符](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec)、[robots.txt 的适用范围](https://developers.google.com/search/docs/crawling-indexing/robots/intro)、[非 HTML 的索引规则](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)。主站的托管响应头能力与支持自定义响应头的平台不同，本次不为此迁移主站或改造分站。

## 依赖与内容边界

现有 Node 24.22.1 LTS、Ruby 4.0.9 已核对官方发布源：[Node](https://nodejs.org/en/blog/release)、[Ruby](https://www.ruby-lang.org/en/news/)。继续核实包注册表及安全审计，兼容升级以最终验收记录为准，不采用预发布版本，也不强行越过 Jekyll 的上游兼容约束。

LEADERS 既有事实复核提示需逐条对照来源，不用代码通过或自动生成内容替代事实校验。本次不猜测或批量改写企业评分。新功能只采纳上表中的分类语言同步与本地阅读列表备份恢复，避免增加登录、服务端收藏、额外搜索或新的设置流程。

## 验收

全部采纳项已实现。执行结果、7.8.0 版本、依赖更新、完整测试证据及发布边界记录在同日修改计划中。
