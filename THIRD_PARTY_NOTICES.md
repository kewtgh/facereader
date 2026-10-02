---
layout: notices
title: 第三方声明与版本说明
title_i18n:
  zh: 第三方声明与版本说明
  en: Third-party Notices & Versions
description: FaceReader 的站点版本、Minimal Mistakes 主题基线及开源许可声明。
permalink: /THIRD_PARTY_NOTICES/
locale: zh-CN
search: false
sitemap: true
---

{% assign fr_version = site.data.theme.version %}
{% assign upstream = site.data.theme.upstream_theme %}

<header class="fr-notices__head">
  <span class="fr-notices__eyebrow">FaceReader · Open source</span>
  <h1 id="page-title" data-fr-i18n-zh="第三方声明与版本说明" data-fr-i18n-en="Third-party Notices & Versions">第三方声明与版本说明</h1>
  <p data-fr-i18n-zh="记录 FaceReader 的主题来源、版本关系与许可信息。感谢开源作者为这个独立博客提供的基础。" data-fr-i18n-en="The theme origins, version history and license information behind FaceReader. With thanks to the open-source authors who made this independent blog possible.">记录 FaceReader 的主题来源、版本关系与许可信息。感谢开源作者为这个独立博客提供的基础。</p>
</header>

<section class="fr-notices__versions" aria-label="版本信息" data-fr-i18n-aria-label-zh="版本信息" data-fr-i18n-aria-label-en="Version information">
  <article class="fr-notices__version fr-notices__version--site">
    <span class="fr-notices__eyebrow" data-fr-i18n-zh="当前站点版本" data-fr-i18n-en="Current site version">当前站点版本</span>
    <h2>FaceReader</h2>
    <p class="fr-notices__number" data-fr-site-version>{{ fr_version }}</p>
    <p data-fr-i18n-zh="围绕长文阅读、专题导航、中英文切换与博客内容组织持续定制。" data-fr-i18n-en="Customized for long-form reading, series navigation, Chinese and English content, and the organization of the blog.">围绕长文阅读、专题导航、中英文切换与博客内容组织持续定制。</p>
  </article>
  <article class="fr-notices__version fr-notices__version--upstream">
    <span class="fr-notices__eyebrow" data-fr-i18n-zh="上游主题基线" data-fr-i18n-en="Upstream theme baseline">上游主题基线</span>
    <h2>{{ upstream.name }} <span>Jekyll Theme</span></h2>
    <p class="fr-notices__number">{{ upstream.version }}</p>
    <p data-fr-i18n-zh="FaceReader 基于此版本进行深度定制，并保留原主题的作者署名与 MIT 许可。" data-fr-i18n-en="The baseline for FaceReader's customizations, with the original author attribution and MIT license preserved.">FaceReader 基于此版本进行深度定制，并保留原主题的作者署名与 MIT 许可。</p>
  </article>
</section>

<section class="fr-notices__explanation" aria-labelledby="version-explanation">
  <span class="fr-notices__eyebrow" data-fr-i18n-zh="版本关系" data-fr-i18n-en="How the versions relate">版本关系</span>
  <h2 id="version-explanation" data-fr-i18n-zh="两个版本号，各自记录一条演进路径。" data-fr-i18n-en="Two version numbers, two development paths.">两个版本号，各自记录一条演进路径。</h2>
  <p data-fr-i18n-zh="FaceReader {{ fr_version }} 表示本站的界面与功能版本；Minimal Mistakes {{ upstream.version }} 表示采用的上游主题基线。本站版本更新不会改变上游版本号，也不代表 Minimal Mistakes 发布了同名版本。" data-fr-i18n-en="FaceReader {{ fr_version }} identifies this site's interface and features; Minimal Mistakes {{ upstream.version }} identifies the upstream theme baseline. A FaceReader release does not change the upstream version or represent a Minimal Mistakes release with the same number.">FaceReader {{ fr_version }} 表示本站的界面与功能版本；Minimal Mistakes {{ upstream.version }} 表示采用的上游主题基线。本站版本更新不会改变上游版本号，也不代表 Minimal Mistakes 发布了同名版本。</p>
</section>

<section class="fr-notices__license" aria-labelledby="license-notice">
  <div class="fr-notices__license-head">
    <div>
      <span class="fr-notices__eyebrow" data-fr-i18n-zh="许可与署名" data-fr-i18n-en="License & attribution">许可与署名</span>
      <h2 id="license-notice">{{ upstream.name }}</h2>
    </div>
    <span class="fr-notices__badge">{{ upstream.license }} License</span>
  </div>
  <p class="fr-notices__copyright">Copyright (c) 2013–2024 Michael Rose and contributors</p>
  <p data-fr-i18n-zh="仓库中的 LICENSE 保留了原始 MIT 许可全文。使用或再分发相关软件时，应保留该许可要求的版权与许可声明。" data-fr-i18n-en="The repository's LICENSE preserves the original MIT license in full. When using or redistributing the software, retain the copyright and permission notices required by that license.">仓库中的 LICENSE 保留了原始 MIT 许可全文。使用或再分发相关软件时，应保留该许可要求的版权与许可声明。</p>
  <nav class="fr-notices__links" aria-label="项目与许可链接" data-fr-i18n-aria-label-zh="项目与许可链接" data-fr-i18n-aria-label-en="Project and license links">
    <a href="{{ upstream.url }}"><span data-fr-i18n-zh="上游主题项目" data-fr-i18n-en="Upstream theme">上游主题项目</span><span aria-hidden="true">↗</span></a>
    <a href="https://github.com/kewtgh/facereader/blob/main/LICENSE"><span data-fr-i18n-zh="阅读完整 MIT 许可" data-fr-i18n-en="Read the MIT license">阅读完整 MIT 许可</span><span aria-hidden="true">↗</span></a>
    <a href="https://github.com/kewtgh/facereader"><span data-fr-i18n-zh="FaceReader 源码" data-fr-i18n-en="FaceReader source">FaceReader 源码</span><span aria-hidden="true">↗</span></a>
  </nav>
</section>

<section class="fr-notices__explanation" aria-labelledby="frontend-notice">
  <span class="fr-notices__eyebrow" data-fr-i18n-zh="前端交互依赖" data-fr-i18n-en="Frontend dependencies">前端交互依赖</span>
  <h2 id="frontend-notice">jQuery & Magnific Popup</h2>
  <p data-fr-i18n-zh="部分页面交互使用 OpenJS Foundation 及其他贡献者提供的 jQuery；图片弹窗使用 Dmytro Semenov 的 Magnific Popup。两者均采用 MIT 许可，打包文件保留其作者署名。" data-fr-i18n-en="Some page interactions use jQuery by the OpenJS Foundation and other contributors; image lightboxes use Magnific Popup by Dmytro Semenov. Both are MIT-licensed, and their author attribution is retained in the bundled script.">部分页面交互使用 OpenJS Foundation 及其他贡献者提供的 jQuery；图片弹窗使用 Dmytro Semenov 的 Magnific Popup。两者均采用 MIT 许可，打包文件保留其作者署名。</p>
  <nav class="fr-notices__links" aria-label="前端依赖许可链接" data-fr-i18n-aria-label-zh="前端依赖许可链接" data-fr-i18n-aria-label-en="Frontend license links">
    <a href="https://jquery.org/license/"><span data-fr-i18n-zh="jQuery 许可" data-fr-i18n-en="jQuery license">jQuery 许可</span><span aria-hidden="true">↗</span></a>
    <a href="https://github.com/dimsemenov/Magnific-Popup/blob/master/LICENSE"><span data-fr-i18n-zh="Magnific Popup 许可" data-fr-i18n-en="Magnific Popup license">Magnific Popup 许可</span><span aria-hidden="true">↗</span></a>
  </nav>
</section>
