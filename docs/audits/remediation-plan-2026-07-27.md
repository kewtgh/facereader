# FaceReader 审计整改与功能实施计划

对应审计：`docs/audits/project-application-audit-2026-07-27.md`

计划日期：2026-07-27

初始状态：待实施

最终状态：已完成

## 1. 完成标准

全部工作完成时必须同时满足：

- LEADERS 证据调整公式有独立单测并按 A/B/C 系数生效。
- LEADERS 查询可通过 URL 恢复、分享和复制。
- 企业总表支持名称/别名、行业、地区组合筛选。
- 标签页支持标签搜索、结果状态和无结果反馈。
- Algolia 远端依赖只在首次打开搜索时加载。
- 通用 i18n 与页面增强逻辑变成可缓存外部资源。
- 本地图片自动获得尺寸；非关键图片自动获得懒加载和异步解码属性。
- 生产 `_site` 不包含开发脚本目录和 JS Source Map。
- 生成 HTML 审计、数据校验、链接检查、i18n、工作流检查、构建全部通过。
- 审计报告和本计划更新为实际完成状态，并进行一次遗漏回查。

## 2. 实施阶段

### 阶段 A：业务逻辑和可测试架构

1. 抽取纯评分函数模块。
2. 修正证据调整公式。
3. 增加 Node 原生测试，覆盖：
   - 阶段权重；
   - A/B/C 证据系数；
   - 空值和非法配置保护；
   - 评级边界。
4. 让浏览器评分页复用同一份公式实现，避免测试和生产逻辑分叉。

验收：`npm run leaders:test` 通过，B/C 证据调整分分别低于同分 A 级结果。

### 阶段 B：LEADERS 产品功能与 UX

1. 查询结果写入 `company`、`stage` URL 参数。
2. 初始化、前进和后退时恢复查询。
3. 增加复制查询链接按钮和 live status。
4. 企业总表增加名称/别名过滤。
5. 修正“加入对比”在三项已满时覆盖第一项的问题。
6. 为雷达图补标题和说明。
7. 数据请求增加 HTTP 状态与空数据检查。

验收：查询、分享、恢复、筛选、对比均可由代码级测试和生成 DOM 检查验证。

### 阶段 C：标签与搜索体验

1. 增加标签搜索输入框、匹配计数和无结果状态。
2. 无效标签 URL 显示明确反馈。
3. 平滑滚动遵循 `prefers-reduced-motion`。
4. 标签组折叠同步 `aria-expanded` / `aria-hidden`。
5. Algolia 依赖改为搜索面板首次打开时加载。
6. 删除无效 Liquid 占位符和未使用的标签折叠代码。

验收：标签筛选和搜索状态均有可访问文本；未打开搜索时不触发 Algolia 初始化。

### 阶段 D：静态架构与性能

1. 把 UI 字典输出为可缓存外部脚本。
2. 把 footer 中的通用 UI、返回入口、评分表增强逻辑抽成外部脚本。
3. 把 Darwin 基准页面脚本抽成外部资源。
4. 新增 Jekyll 图片增强插件：
   - 解析 PNG/JPEG/GIF/WebP 尺寸；
   - 仅处理站内安全路径；
   - 保留已有作者设置；
   - 排除 Logo、作者头像和 Hero 的懒加载。
5. 从生产输出排除开发脚本和 Source Map。
6. 将 Algolia 初始化器一并外置并纳入禁止重复内联的回归检查。

验收：

- 页面不再重复内联完整 UI 字典。
- 本地可解析图片缺尺寸数为 0。
- 关键图片不被错误设置为 lazy。
- `_site/assets/scripts` 和 `_site/assets/js/main.min.js.map` 不存在。

### 阶段 E：生产质量门禁和配置清理

1. 新增生成 HTML 审计脚本，检查：
   - 重复 ID；
   - 图片 `alt`；
   - 本地图片尺寸；
   - 表单可访问名称；
   - `target="_blank"` 的 `noopener`；
   - 不应发布的开发产物。
2. 将评分单测、工作流校验和 HTML 审计纳入统一检查。
3. 合并 robots 通用规则。
4. 保留作者区与 footer 的匿名运营链接和标签占位，不擅自清理。
5. 更新 README 的开发与验证命令。
6. 删除分享按钮的内联事件，使用安全的新标签页链接并补齐可访问名称。

验收：统一检查在正常环境中一次通过，受限环境导致的 Sass 子进程限制单独说明并用直接构建结果交叉验证。

### 阶段 F：最终回查

1. 逐条对照 A-01 至 A-13。
2. 检查计划中是否有遗漏、半成品或未接入生产的代码。
3. 重建 `_site` 后重新统计 HTML、图片、内联脚本与公开产物。
4. 审阅最终 `git diff`，确认没有覆盖用户原有改动。
5. 更新审计报告与计划状态，记录实测结果和剩余限制。

## 3. 变更风险控制

- 不改变既有文章 URL、CNAME、canonical、sitemap 主域或 Algolia 索引名。
- 不引入账号、支付、数据库或新的外部服务。
- 不批量改写文章正文。
- 不删除作者区或 footer 的链接、标签及匿名运营占位。
- 图片增强只补缺失属性，不覆盖作者显式设置。
- 评分公式变更必须由模型配置和自动测试共同约束。
- 任何生成物数量或链接集合变化都要在最终报告中解释。

## 4. 计划执行记录

| 阶段 | 状态 | 结果 |
| --- | --- | --- |
| A 业务逻辑和可测试架构 | 已完成 | 纯函数已抽取；A/B/C 证据折扣、权重归一化、非法配置和评级边界测试通过。 |
| B LEADERS 产品功能与 UX | 已完成 | URL 恢复/分享/复制、名称与别名筛选、对比槽替换、雷达说明及数据请求防护已接入。 |
| C 标签与搜索体验 | 已完成 | 标签搜索、计数、空状态、历史恢复、减少动态效果和 Algolia 按需加载已接入。 |
| D 静态架构与性能 | 已完成 | UI、Algolia、Darwin 脚本外置；图片构建增强生效；开发脚本和 Source Map 已从生产输出移除。 |
| E 生产质量门禁和配置清理 | 已完成 | HTML 审计纳入统一检查；robots 合并；分享链接清理；README 更新；匿名占位按用户要求保留。 |
| F 最终回查 | 已完成 | 243 页重建和复审通过；补齐 A-14/A-15；无已知未接线或半成品修改。 |

## 5. 最终验收记录

执行结果：

```text
LEADERS scoring tests passed.
LEADERS data OK: 271 companies, 271 Darwin-scored, 15 benchmark samples.
i18n validation OK: 99 posts checked, 1 translation group(s).
GitHub Actions workflow validation passed.
Sass deprecation warning check passed.
Internal links OK: 243 HTML files checked.
Generated HTML OK: 243 files, 935 images,
0 dimension issues, 0 loading issues, 146814 inline script bytes.
```

同时确认：

- `npm audit --audit-level=moderate`：0 个已知漏洞。
- `_site/assets/scripts`：不存在。
- `_site/assets/js/main.min.js.map`：不存在。
- `git diff --check`：通过。
- 作者区和 footer 链接、标签及匿名占位：保留。

生产模式需要由部署环境注入 `ALGOLIA_SEARCH_API_KEY`。本地最终生产构建使用非敏感占位值只验证编译与产物结构；现有缺密钥即中止的生产保护没有被绕过或削弱。
