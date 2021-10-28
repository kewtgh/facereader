---
title: "100% Free"
permalink: /docs/free/
excerpt: "Instructions on how to customize the main navigation and enabling breadcrumb links."
layout: single
toc: true
class: wide
author_profile: false
show_date: false
---

Customize site navigational links through a Jekyll data file.

## Masthead

The masthead links use a "priority plus" design pattern. Meaning, show as many navigation items that will fit horizontally with a toggle to reveal the rest.

To define these links add titles and URLs under the `main` key in `_data/navigation.yml`:

```yaml
main:
  - title: "Quick-Start Guide"
    url: /docs/quick-start-guide/
  - title: "Posts"
    url: /year-archive/
  - title: "Categories"
    url: /categories/
  - title: "Tags"
    url: /tags/
  - title: "Pages"
    url: /page-archive/
  - title: "Collections"
    url: /collection-archive/
  - title: "External Link"
    url: https://google.com
```
