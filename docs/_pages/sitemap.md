---
layout: archive
title: "站点地图"
permalink: /sitemap/
author_profile: false
sitemap: false
---

这里列出站内主要页面与文章。面向搜索引擎和自动化工具的 XML 版本在 [sitemap.xml]({{ "sitemap.xml" | relative_url }})。

<h2>页面</h2>
{% for post in site.pages %}
  {% include archive-single.html %}
{% endfor %}

<h2>文章</h2>
{% for post in site.posts %}
  {% include archive-single.html %}
{% endfor %}

{% capture written_label %}'None'{% endcapture %}

{% for collection in site.collections %}
{% unless collection.output == false or collection.label == "posts" %}
  {% capture label %}{{ collection.label }}{% endcapture %}
  {% if label != written_label %}
  <h2>{{ label }}</h2>
  {% capture written_label %}{{ label }}{% endcapture %}
  {% endif %}
{% endunless %}
{% for post in collection.docs %}
  {% unless collection.output == false or collection.label == "posts" %}
  {% include archive-single.html %}
  {% endunless %}
{% endfor %}
{% endfor %}
