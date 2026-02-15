---
layout: default
title: Posts
permalink: /posts/
pagination:
  enabled: true
  collection: posts
  per_page: 10
  permalink: /posts/page/:num/
---

<h1>Posts</h1>

<ul>
  {% for post in paginator.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <small style="color:#666;"> — {{ post.date | date: "%Y-%m-%d" }}</small>
    </li>
  {% endfor %}
</ul>

<nav style="display:flex; gap:12px; margin-top:20px;">
  {% if paginator.previous_page %}
    <a href="{{ paginator.previous_page_path | relative_url }}">← Newer</a>
  {% endif %}
  {% if paginator.next_page %}
    <a href="{{ paginator.next_page_path | relative_url }}">Older →</a>
  {% endif %}
</nav>
