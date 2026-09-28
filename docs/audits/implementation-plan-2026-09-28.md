# FaceReader 复审整改计划（2026-09-28）

对应 [审计记录](project-audit-2026-09-28.md)。目标是封住发布边界、恢复阅读地图可发现性、确保系列语言退路、校正版本元数据；维持博客定位，不加入下载/导出功能。

## 顺序与验收

1. A01 发布边界：排除 `research`，重建后 `_site/research` 不存在，sitemap 不含 `/research/`；CLI 对源研究文件的验证继续通过。
2. A02 阅读地图 SEO：移除 `/categories/` 的 noindex/禁用 sitemap；生成页无 noindex 且 sitemap 含该 URL。`/tags/` 策略不变。
3. A03 系列：按可见文章统计中文/英文列表；有英文译文时切换对应列表，无译文时英文 UI 不会产生空列表；增加生成页与浏览器回归。
4. A04 版本元数据：运行仓库已有生成任务，同步版权/JS；审计检查生成页的版本号与 `package.json` 一致。
5. A05 手机页眉：窄屏使用完整可见的简短品牌词，桌面和辅助技术仍保留站点全称。
6. A06 内容定位：用双语阅读方法和局限替代付费版 CTA；修正项目说明，检查渲染页不再承诺专业决策用途。
7. 回归：`npm run site:build`、`npm run site:check`、Chromium 1243 浏览器测试；检查阅读地图、LCER 系列、传统中文系列、主要文章、桌面/移动无明显回归。结果记录于下方。

## 范围和约束

- 保留旧文章、taxonomy、permalink、搜索、站点语言机制与已有设计。不编辑历史文章内容或评分结论。
- 不推送网站、不请求外部索引变更；此次用户未要求更新版本或提交，完成后保留可审阅 diff。
- 若审计发现需作者决策的编辑或产品方向问题，只记录，不自行扩大为新专业分析功能。

## 执行与验收记录

|阶段|结果|
|---|---|
|A01 发布边界|`research` 从 Jekyll 输出排除；重建后 `_site/research` 不存在，sitemap 不含 `/research/`，评分源数据验证仍通过。发布审计增加长期回归门禁。|
|A02 阅读地图 SEO|`/categories/` 生成页不再含 `noindex`，sitemap 收录其 URL；`/tags/` 未改。|
|A03 系列|LCER 中文/英文各 3 篇，语言切换后对应列表可见；分类型领导力系列在切换界面语言后仍保留文章列表。对无译文的未来 Front Matter 系列，模板不再生成空英文列表。计数与连续编号只计算可见文章。|
|A04 版本|重新生成版权头与 `main.min.js`，版权版本和 `package.json` 均为 7.1.9；生成页审计加入版本一致性检查。未更新版本号。|
|A05 手机页眉|390px 截图中的 `FaceReade…` 改为完整 `FaceReader`；链接的可访问名称随中英文界面切换。|
|A06 博客定位|LEADERS 页的付费/专业版卡片及咨询 CTA 改为阅读方法与局限说明；页眉次要按钮指向评分方法；明确不将评分直接用于投资、合作或招聘决策。原评分数据、查询和打印机制未动。|
|全量回归|`npm run site:build`、`npm run site:check`、`npm run site:browser` 均通过。Chromium 1243 检查 1440/1024/390px：首页、文章、Posts、Categories、Tags、LEADERS、benchmark 等页面无页面级横向溢出或未捕获脚本异常。|

最终构建：243 个 HTML、928 张图片；生成页审计报告 0 图片尺寸/加载属性问题；内部链接通过；CSS 191055 bytes raw / 33608 gzip / 28182 brotli，预算通过。测试中现有 LEADERS 校验仍列出 39 条编辑复核事项、25 条评分差异提醒；这是供作者人工核查的队列，不代表结构校验失败，也不自动改分。未发现新增 Jekyll 构建警告。

本地截图（`tmp/` 不发布）：`tmp/audit-2026-09-28/article-desktop.png`、`article-mobile.png`、`posts-desktop.png`、`categories-desktop.png`、`lcer-series-en.png`。截图检查确认 Hero、归档侧栏、阅读地图和系列卡片未出现本次布局回归。无译文的未来系列退路目前由模板条件保护，尚无真实仅中文的 Front Matter 系列页面可作端到端样本。

线上旧 `/research/` URL 与搜索索引状态需部署后人工复查；本地构建不能直接删除搜索引擎缓存。初次整改未发布、未提交；随后用户要求更新版本并提交，补丁版本定为 7.1.10，仍不推送或部署。7.1.10 再次执行 Jekyll build、完整 `site:check` 与 Chromium 1243 回归，全部通过。
