# FaceReader 7.2.2 — 注释徽标与返回正文

## 原因与修复

- 正文注释链接继承段落的 `text-indent`，使 inline-flex 数字徽标产生多余宽度；现已单独重置缩进，调整尺寸、字重与圆角，支持多位数字。
- 文末左侧数字原先是不可点击的有序列表 marker。渐进增强为实际链接，直接复用 Jekyll 生成的原返回地址，不猜测 ID；没有 JavaScript 时仍保留列表和原返回箭头。
- 保留原返回箭头（包括重复引用的多个返回地址），为左右返回链接补充中英文可访问标签。
- 注释跳转不再使用通用标题平滑滚动器，改用原生 fragment/history 与现有 scroll-margin；返回后恢复到注释引用的键盘焦点，并突出当前位置。
- 点击注释时关闭悬停预览；悬停和键盘预览继续可用。

## 验证范围

Jekyll 构建、`site:check`、Chromium 1243 页面回归；额外验证中文桌面、中文手机、英文手机的徽标缩进与宽高、左侧数字和原箭头返回路径、URL hash 与引用可见性。截图位于 `tmp/audit-2026-10-03/footnote-badge-*` 和 `footnote-list-*`。

结果：Jekyll 构建及完整 `site:check` 通过；Chromium 回归通过，未捕获浏览器异常。245 个生成 HTML 页面和站内链接检查通过；CSS gzip 34741 bytes，预算检查通过。既有评分内容复核提示保持不变。

保留现有文章 Markdown、permalink 和注释 ID，不要求历史文章迁移。未添加下载功能，未推送或部署。
