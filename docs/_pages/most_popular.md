---
title: 热门文章
title_i18n:
  zh: "热门文章"
  en: "Most Popular"
layout: archive
permalink: /most_popular/
entries_layout: grid
classes:
  - fr-wide-full
sitemap: false
description: 站内热门文章合集：快速进入最受欢迎的企业与人性分析内容。
---

{% assign popular_posts = site.posts | where: "most_popular", true %}
<div class="entries-{{ page.entries_layout | default: 'list' }}">
  {% include documents-collection.html entries=popular_posts sort_by="title" type=page.entries_layout %}
</div>
