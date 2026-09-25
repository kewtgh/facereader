---
layout: archive
title: 生命周期综合汲取率
title_i18n:
  zh: 生命周期综合汲取率
  en: Lifecycle Comprehensive Extraction Rate
permalink: /series/lcer/
sitemap: false
---

<p data-fr-i18n-zh="{{ site.data.series.lcer.description_zh }}" data-fr-i18n-en="{{ site.data.series.lcer.description_en }}">{{ site.data.series.lcer.description_zh }}</p>
{% assign zh_posts = site.posts | where: "series", "lcer" | where: "locale", "zh-CN" | sort: "series_order" %}
{% assign en_posts = site.posts | where: "series", "lcer" | where: "locale", "en-US" | sort: "series_order" %}
<div data-fr-i18n-block="zh">
  <ol class="fr-series-index">
    {% for post in zh_posts %}<li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>{% endfor %}
  </ol>
</div>
<div data-fr-i18n-block="en" hidden>
  <ol class="fr-series-index">
    {% for post in en_posts %}<li><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>{% endfor %}
  </ol>
</div>
