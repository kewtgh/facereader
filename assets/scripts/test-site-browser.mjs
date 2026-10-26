// Run after site:build. Uses an installed Playwright; does not download browsers.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { testPublicationFeatures } from "./test-publication-features.mjs";
import { testReadingFeatures } from "./test-reading-features.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(process.env.FR_SITE_ROOT || "_site");
const siteVersion = JSON.parse(await fs.readFile("package.json", "utf8")).version;
const output = path.resolve(process.env.FR_BROWSER_OUTPUT || "tmp/browser-regression");
await fs.mkdir(output, { recursive: true });
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(root, "." + pathname, pathname.endsWith("/") ? "index.html" : "");
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
  if (!process.env.FR_READING_ONLY) {
  // Categories are editorial metadata and can change the permalink. Resolve
  // representative articles from the generated catalog by their stable slug.
  const catalog = JSON.parse(await fs.readFile(path.join(root, "category-index.json"), "utf8"));
  const publishedUrls = [...new Set(Object.values(catalog).flatMap(category => category.posts.map(post => post.url)))];
  const articleUrl = slug => {
    const matches = publishedUrls.filter(url => decodeURIComponent(url).split("/").filter(Boolean).at(-1) === slug);
    assert.equal(matches.length, 1, `Expected one published browser fixture for ${slug}; found ${matches.length}`);
    return matches[0];
  };
  const article = articleUrl("manage-leadership12");
  const englishFootnotes = articleUrl("Society-lcer-canada-en");
  const japanArticles = [articleUrl("Society-lcer-japan"), articleUrl("Society-lcer-japan-en")];
  const mathArticles = [[articleUrl("Society-lcer-finland"), "zh"], [articleUrl("Society-lcer-finland-en"), "en"]];
  // Fresh visitors, remembered choices, unavailable APIs and equal UTC offsets.
  for (const scenario of [
    { timezoneId: 'Asia/Shanghai', locale: 'en-US', expected: 'zh' },
    { timezoneId: 'Asia/Taipei', locale: 'en-US', expected: 'zh' },
    { timezoneId: 'Asia/Hong_Kong', expected: 'zh' },
    { timezoneId: 'Asia/Macau', expected: 'zh' },
    { timezoneId: 'Asia/Singapore', expected: 'zh' },
    { timezoneId: 'Asia/Urumqi', expected: 'zh' },
    { timezoneId: 'America/New_York', locale: 'zh-CN', expected: 'en' },
    { timezoneId: 'Europe/London', expected: 'en' },
    { timezoneId: 'Asia/Manila', expected: 'en' },
    { timezoneId: 'Australia/Perth', expected: 'en' },
    { timezoneId: 'UTC', expected: 'en' },
    { timezoneId: 'Asia/Taipei', stored: 'en', expected: 'en' },
    { timezoneId: 'America/New_York', stored: 'zh', expected: 'zh' },
    { timezoneId: 'Asia/Taipei', stored: 'invalid', expected: 'zh' },
    { timezoneId: 'UTC', unavailable: true, locale: 'zh-TW', expected: 'zh' },
    { timezoneId: 'UTC', unavailable: true, locale: 'en-US', expected: 'en' },
    { timezoneId: 'UTC', unavailable: true, locale: 'fr-FR', expected: 'zh' },
    { timezoneId: 'Asia/Taipei', blockedStorage: true, expected: 'zh' }
  ]) {
    const visitor = await browser.newContext({ timezoneId: scenario.timezoneId, locale: scenario.locale || 'en-US' });
    await visitor.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await visitor.addInitScript(({ stored, unavailable, blockedStorage }) => {
      if (stored) localStorage.setItem('facereader.uiLanguage', stored);
      if (unavailable) Intl.DateTimeFormat = () => { throw new Error('Time zone unavailable'); };
      if (blockedStorage) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    }, scenario);
    const visitorPage = await visitor.newPage();
    await visitorPage.goto(base + '/');
    assert.equal(await visitorPage.locator('html').getAttribute('data-fr-ui-lang'), scenario.expected, JSON.stringify(scenario));
    assert.equal(await visitorPage.locator('.home-section--posts .archive__item:visible').count(), 8);
    assert.equal(await visitorPage.locator('.home-section--posts .archive__item:visible').evaluateAll((cards, language) => cards.every(card => card.lang.startsWith(language)), scenario.expected), true);
    if (!scenario.blockedStorage && !scenario.stored) assert.equal(await visitorPage.evaluate(() => localStorage.getItem('facereader.uiLanguage')), null);
    if (scenario.blockedStorage) {
      await visitorPage.locator('[data-fr-ui-lang-option="en"]').click();
      assert.equal(await visitorPage.locator('html').getAttribute('data-fr-ui-lang'), 'en');
    }
    await visitor.close();
  }
  console.log('Time-zone defaults, browser fallback, remembered choices and blocked storage passed.');
  const context = await browser.newContext({ reducedMotion: "reduce", timezoneId: "Asia/Taipei", locale: "zh-CN" });
  let allowSearchCdn = false;
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const searchDependency = url.origin === "https://cdn.jsdelivr.net" && /^\/npm\/(algoliasearch@5\.60\.0|instantsearch\.js@4\.121\.0|instantsearch\.css@8\.25\.0)\//.test(url.pathname);
    if (allowSearchCdn && searchDependency && process.env.FR_SEARCH_FIXTURES) {
      const filename = url.pathname.includes("algoliasearch@") ? "algolia.js" : url.pathname.includes("instantsearch.js@") ? "instantsearch.js" : "instantsearch.css";
      return route.fulfill({ contentType: filename.endsWith("css") ? "text/css" : "application/javascript", body: await fs.readFile(path.join(process.env.FR_SEARCH_FIXTURES, filename)) });
    }
    return url.origin === base || (allowSearchCdn && searchDependency) ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.stack || error.message));
  const goto = async (url) => {
    const response = await page.goto(base + url);
    assert.equal(response.status(), 200, `Browser fixture ${url} returned HTTP ${response.status()}`);
    return response;
  };
  const noOverflow = async () => {
    const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")].filter((e) => {
        const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(e).position !== "fixed";
      }).slice(0, 12).map((e) => `${e.tagName}.${e.className}`) }));
    if (result.scrollWidth > result.width + 1) await page.screenshot({ path: path.join(output, "overflow.png") });
    assert.ok(result.scrollWidth <= result.width + 1, `Horizontal overflow: ${page.url()} ${JSON.stringify(result)}`);
  };
  let lastChinesePage;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ['zh', 'en']) {
      await goto('/posts/');
      await page.locator(`[data-fr-ui-lang-option="${language}"]`).click();
      const visibleArchive = page.locator('.fr-posts-list > [data-fr-i18n-block]:visible');
      const pages = await visibleArchive.locator('.pagination a').evaluateAll(links => links.map(link => ({ url: link.getAttribute('href'), number: Number(link.textContent) })).filter(link => Number.isFinite(link.number)));
      const totalPages = Math.max(1, ...pages.map(link => link.number));
      if (language === 'zh') lastChinesePage = totalPages;
      const seen = new Set();
      for (let number = 1; number <= totalPages; number++) {
        await goto(number === 1 ? '/posts/' : `/posts/page/${number}/`);
        const cards = page.locator('.fr-posts-card:visible');
        const items = await cards.evaluateAll(cards => cards.map(card => ({ language: card.lang, url: card.querySelector('h3 a').getAttribute('href') })));
        assert.ok(items.length > 0 && items.length <= 10);
        if (number < totalPages) assert.equal(items.length, 10);
        for (const item of items) {
          assert.ok(item.language.startsWith(language));
          assert.ok(!seen.has(item.url), `Repeated ${language} article: ${item.url}`);
          seen.add(item.url);
        }
        await noOverflow();
      }
      await goto('/');
      const recent = await page.locator('.home-section--posts .archive__item:visible a.u-url').evaluateAll(links => links.map(link => link.getAttribute('href')));
      assert.deepEqual(recent, [...seen].slice(0, 8));
      await page.locator('.home-section--posts').screenshot({ path: path.join(output, `language-recent-${language}-${width}.png`), animations: 'disabled' });
      await page.locator(`[data-fr-ui-lang-option="${language === 'zh' ? 'en' : 'zh'}"]`).click();
      assert.equal(await page.locator('.home-section--posts .archive__item:visible').evaluateAll((cards, language) => cards.every(card => card.lang.startsWith(language)), language === 'zh' ? 'en' : 'zh'), true);
      await noOverflow();
    }
  }
  await page.evaluate(() => localStorage.setItem('facereader.uiLanguage', 'zh'));
  await goto(`/posts/page/${lastChinesePage}/`);
  await page.locator('[data-fr-ui-lang-option="en"]').click();
  await page.waitForURL(base + '/posts/');
  assert.equal(await page.locator('.fr-posts-card:visible').evaluateAll(cards => cards.every(card => card.lang.startsWith('en'))), true);
  await goto(`/posts/page/${lastChinesePage}/`);
  await page.waitForURL(base + '/posts/');
  await page.locator('[data-fr-ui-lang-option="zh"]').click();
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  await noScript.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const fallbackPage = await noScript.newPage();
  await fallbackPage.goto(base + '/posts/');
  assert.equal(await fallbackPage.locator('.fr-posts-card:visible').evaluateAll(cards => cards.every(card => card.lang.startsWith('zh'))), true);
  await noScript.close();
  console.log('Both language archives have complete independent pagination; recent updates, mobile layout, language switching and no-JS fallback passed.');
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ["/", "/posts/", "/categories/", "/tags/", "/most_popular/", "/about/", "/THIRD_PARTY_NOTICES/", "/leaders-scorecard/", "/darwin-leaders-benchmark/", article, englishFootnotes]) {
      await goto(url);
      await page.waitForTimeout(150);
      await noOverflow();
      if (url === "/THIRD_PARTY_NOTICES/") {
        assert.equal(await page.locator("[data-fr-site-version]").textContent(), siteVersion);
        if ([1440, 390].includes(width)) await page.screenshot({ path: path.join(output, `notices-${width}.png`), fullPage: true, animations: "disabled" });
      }
      if (width === 390) {
        assert.equal(await page.locator(".greedy-nav .site-title__compact").isVisible(), true, "Mobile brand name should not be ellipsized");
      }
      if (width === 1440 && ["/posts/", "/categories/", article].includes(url)) {
        const label = url === article ? "article" : url.slice(1, -1);
        await page.screenshot({ path: path.join(output, `${label}-desktop.png`), animations: "disabled" });
      }
      if (width === 390 && url === article) {
        await page.screenshot({ path: path.join(output, "article-mobile.png"), animations: "disabled" });
      }
    }
    console.log(`Page smoke passed at ${width}px.`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  // Math is rendered locally only on opted-in pages, including footnotes.
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [url, language] of mathArticles) {
      await goto(url);
      assert.equal(await page.locator('script[src*="/assets/js/math-render.js"]').count(), 1, `${url}: local math renderer must be enabled`);
      await page.locator('.page__content .katex-display').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.page__content .katex-display').count(), 2);
      assert.ok(await page.locator('.page__content .katex:not(.katex-display .katex)').count() >= 4);
      assert.equal(await page.locator('.katex-error').count(), 0);
      const equations = await page.locator('.page__content .katex annotation').allTextContents();
      assert.ok(equations.some((tex) => tex.includes('53\\%') && tex.includes('\\times')));
      assert.ok(equations.some((tex) => tex.includes('\\sum') && tex.includes('\\frac')));
      assert.ok(equations.some((tex) => tex === 't=43'));
      assert.equal(await page.locator('.page__content .katex math').count(), equations.length);
      const rawDelimiters = await page.locator('.page__content').evaluate((content) => {
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!node.parentElement.closest('.katex, code, pre') && /\\[\[\]()]/.test(node.textContent)) return true;
        }
        return false;
      });
      assert.equal(rawDelimiters, false, 'No raw formula delimiters should remain');
      await noOverflow();
      const equation = page.locator('.page__content .katex-display').first();
      await equation.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `finland-math-${language}-${width}.png`), animations: 'disabled' });
      assert.equal(await page.locator('script[src*="cdn"][src*="katex"]').count(), 0);
      if (language === 'en') assert.ok(await page.locator('.footnotes .katex').count() > 0);
    }
  }
  await goto(article);
  assert.equal(await page.locator('script[src*="math-render"], script[src*="katex"], link[href*="katex"]').count(), 0);
  console.log('Finnish article math, inline equations, footnotes, MathML and mobile overflow checks passed without a CDN.');
  // Image cards and tag discovery stay readable on desktop and mobile.
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const checkTeaserCenter = async () => {
      const cards = await page.locator('.fr-posts-card--image:visible').evaluateAll((cards) => cards.slice(0, 6).map((card) => {
        const image = card.querySelector('.fr-posts-card__image').getBoundingClientRect();
        const body = card.querySelector('.fr-posts-card__body');
        let top, bottom;
        if (getComputedStyle(body).display === 'contents') {
          top = card.querySelector('.fr-posts-card__meta').getBoundingClientRect().top;
          bottom = card.querySelector('h3').getBoundingClientRect().bottom;
        } else {
          const bounds = body.getBoundingClientRect(); top = bounds.top; bottom = bounds.bottom;
        }
        return Math.abs((image.top + image.bottom) / 2 - (top + bottom) / 2);
      }));
      cards.forEach((difference) => assert.ok(difference < 2, `Teaser center offset: ${difference}px`));
    };
    await goto('/posts/');
    const image = page.locator('.fr-posts-card:visible .fr-posts-card__image img').first();
    await image.waitFor();
    assert.equal(await image.getAttribute('loading'), 'lazy');
    assert.ok(await image.getAttribute('width'));
    const geometry = await image.evaluate((element) => ({ image: element.getBoundingClientRect().toJSON(), title: element.closest('article').querySelector('h3').getBoundingClientRect().toJSON() }));
    assert.ok(geometry.image.right <= geometry.title.left + 1, 'Teaser should appear to the left of the title');
    await checkTeaserCenter();
    const railScroll = await page.locator('.fr-archive-rail').evaluate((element) => ({ position: getComputedStyle(element).position, overflow: getComputedStyle(element).overflowY, maxHeight: getComputedStyle(element).maxHeight }));
    assert.equal(railScroll.position, 'static', 'Sidebar should scroll with the page');
    assert.equal(railScroll.overflow, 'visible');
    assert.equal(railScroll.maxHeight, 'none');
    const seriesRows = await page.locator('.fr-archive-rail > section:first-child li').evaluateAll((rows) => rows.map((row) => ({ count: row.querySelector('.fr-archive-rail__count').textContent, label: row.querySelector('.fr-archive-rail__label').textContent, wholeLink: !!row.querySelector('a .fr-archive-rail__count') })));
    assert.ok(seriesRows.length > 1);
    seriesRows.forEach((row) => { assert.ok(Number(row.count) > 0, row.label); assert.ok(row.wholeLink); });
    await noOverflow();
    await page.screenshot({ path: path.join(output, `posts-teasers-${width}.png`), animations: 'disabled' });
    await goto('/tags/');
    await checkTeaserCenter();
    assert.equal(await page.locator('#page-title').count(), 1);
    assert.equal(await page.locator('#tag-posts .tag-post-item:not([hidden])').count(), 12);
    const directory = page.locator('#tag-directory');
    if (width === 390) {
      assert.equal(await directory.getAttribute('open'), null);
      await directory.locator(':scope > summary').click();
    }
    const search = page.locator('#tag-directory-query');
    await search.fill('不存在的标签-xyz');
    assert.equal(await page.locator('#tag-directory-empty').isVisible(), true);
    await search.fill('孙子兵法');
    const tag = page.locator('.tag-filter-btn:not([hidden])').filter({ hasText: '孙子兵法' }).first();
    const selected = await tag.getAttribute('data-tag');
    const expected = await page.locator('.tag-post-item').evaluateAll((posts, tag) => posts.filter((post) => JSON.parse(post.dataset.tags).includes(tag)).length, selected);
    await tag.click();
    assert.equal(new URL(page.url()).searchParams.get('tag'), selected);
    assert.match(await page.locator('#current-tag-count').textContent(), new RegExp(String(expected)));
    assert.equal(await page.locator('#tag-posts .tag-post-item:not([hidden])').count(), Math.min(12, expected));
    assert.equal(await page.locator('#tag-posts .tag-post-item:not([hidden])').evaluateAll((posts, tag) => posts.every((post) => JSON.parse(post.dataset.tags).includes(tag)), selected), true);
    await noOverflow();
    await page.screenshot({ path: path.join(output, `tags-results-${width}.png`), animations: 'disabled' });
    if (expected > 12) {
      await page.locator('#tag-posts-more').click();
      assert.equal(await page.locator('#tag-posts .tag-post-item:not([hidden])').count(), Math.min(24, expected));
    }
    await page.locator('[data-fr-ui-lang-option="en"]').click();
    assert.equal(await page.locator('#current-tag').textContent(), selected);
    assert.match(await page.locator('#current-tag-count').textContent(), /essays/);
    await page.locator('#tag-filter-reset').click();
    assert.equal(new URL(page.url()).searchParams.has('tag'), false);
    assert.equal(await page.locator('#tag-posts .tag-post-item:not([hidden])').count(), 12);
    await page.goBack();
    assert.equal(await page.locator('#current-tag').textContent(), selected);
    await page.reload();
    assert.equal(await page.locator('#current-tag').textContent(), selected);
    await goto('/tags/?tag=unknown-tag-xyz');
    assert.equal(await page.locator('#tag-posts-empty').isVisible(), true);
    await page.locator('#tag-filter-reset').click();
    assert.equal(await page.locator('#tag-posts-empty').isHidden(), true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto('/tags/');
  await page.screenshot({ path: path.join(output, 'tags-directory-desktop.png'), animations: 'disabled' });
  console.log('Teaser layout, tag search, counts, pagination, history, deep links and bilingual states passed.');
  await goto("/THIRD_PARTY_NOTICES/");
  await page.locator('[data-fr-ui-lang-option="en"]').click();
  assert.equal(await page.locator("#page-title").textContent(), "Third-party Notices & Versions");
  assert.equal(await page.locator("[data-fr-site-version]").textContent(), siteVersion);
  await noOverflow();
  await page.screenshot({ path: path.join(output, "notices-en.png"), fullPage: true, animations: "disabled" });
  await page.locator('[data-fr-ui-lang-option="zh"]').click();
  await goto("/categories/");
  await page.locator("#category-filter").fill("孙子");
  assert.equal(await page.locator(".fr-category-directory li:not([hidden])").count(), 1);
  await page.locator("#category-filter").fill("no-such-category");
  assert.equal(await page.locator(".fr-category-directory li:not([hidden])").count(), 0);
  await page.locator("#category-filter").fill("");
  let failures = 0;
  await page.route("**/category-index.json*", (route) => failures++ === 0 ? route.fulfill({ status: 503, body: "unavailable" }) : route.continue());
  await page.locator(".fr-category-directory a").first().click();
  await page.locator("#category-detail-retry:not([hidden])").waitFor();
  await page.locator("#category-detail-retry").click();
  await page.locator("#category-detail-posts li").first().waitFor();
  assert.ok(await page.locator("#category-detail-posts img").count());
  await page.unroute("**/category-index.json*");
  // A pending category response must not undo navigation back to the map.
  await goto("/categories/");
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("**/category-index.json*", async (route) => { await gate; await route.continue(); });
  await page.locator(".fr-category-directory a").first().click();
  await page.waitForFunction(() => document.querySelector("#category-detail").getAttribute("aria-busy") === "true");
  await page.evaluate(() => { location.hash = "page-title"; });
  await page.waitForFunction(() => document.querySelector("#category-detail").hidden);
  release();
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#category-detail").evaluate((e) => e.hidden), true);
  await page.unroute("**/category-index.json*");
  console.log("Category search, failure/retry, and stale response checks passed.");
  await goto("/series/lcer/");
  await page.locator('[data-fr-ui-lang-option="zh"]').click();
  const zhSeriesCount = await page.locator('.fr-series-detail ul[data-fr-i18n-block="zh"] li').count();
  assert.ok(zhSeriesCount > 0);
  assert.equal(await page.locator('.fr-series-detail h2').textContent(), `${zhSeriesCount} 篇文章`);
  await page.locator('[data-fr-ui-lang-option="en"]').click();
  const enSeriesCount = await page.locator('.fr-series-detail ul[data-fr-i18n-block="en"] li').count();
  assert.ok(enSeriesCount > 0);
  assert.equal(await page.locator('.fr-series-detail ul[data-fr-i18n-block="zh"]').isHidden(), true);
  assert.equal(await page.locator('.fr-series-detail ul[data-fr-i18n-block="en"]').isVisible(), true);
  assert.equal(await page.locator('.fr-series-detail h2').textContent(), `${enSeriesCount} essays`);
  await page.screenshot({ path: path.join(output, "lcer-series-en.png"), animations: "disabled" });
  await goto("/series/leadership/");
  const leadershipCount = await page.locator(".fr-series-detail > ul li").count();
  assert.ok(leadershipCount > 1, "Traditional category series should show its article list");
  await page.locator('[data-fr-ui-lang-option="zh"]').click();
  assert.equal(await page.locator(".fr-series-detail > ul li").count(), leadershipCount);
  console.log("Bilingual and category-based series remain readable after language switching.");
  // All series views must share membership and order, with accessible mobile controls.
  for (const [seriesUrl, language] of [["/series/leadership/", "zh"], ["/series/sunzi/", "zh"], ["/series/lcer/", "en"]]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(seriesUrl);
    const listSelector = seriesUrl.includes("lcer") ? '.fr-series-detail ul[data-fr-i18n-block="en"] a.fr-category-detail__card' : '.fr-series-detail > ul a.fr-category-detail__card';
    const expectedLinks = await page.locator(listSelector).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    assert.ok(expectedLinks.length > 1);
    const currentIndex = Math.min(2, expectedLinks.length - 1);
    await goto(expectedLinks[currentIndex]);
    assert.equal(await page.locator('.fr-reader-tools__btn--series').isVisible(), true);
    await page.locator('.fr-reader-tools__btn--series').click();
    const desktopDialog = page.locator('#fr-series-panel .fr-mobile-toc__panel');
    await desktopDialog.waitFor({ state: 'visible' });
    const appearance = await desktopDialog.evaluate((element) => ({ background: getComputedStyle(element).backgroundColor, blur: getComputedStyle(element).backdropFilter }));
    assert.match(appearance.background, /rgba\(.+, 0\.88\)/, 'Series panel should be translucent');
    assert.match(appearance.blur, /blur\(/);
    await noOverflow();
    await page.screenshot({ path: path.join(output, 'series-desktop-' + language + '-' + seriesUrl.split('/')[2] + '.png'), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator('[data-fr-ui-lang-option="' + language + '"]').click();
    await page.waitForTimeout(150);
    const trigger = page.locator('.fr-reader-tools__btn--toc');
    assert.equal(await page.locator('.fr-reader-tools__btn--series').isVisible(), false);
    assert.equal(await page.locator('.fr-reader-tools button:visible').count(), 2);
    await trigger.waitFor({ state: "visible" });
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight / 2));
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const before = await page.evaluate(() => scrollY);
    await trigger.click();
    const dialog = page.locator('#fr-toc-panel .fr-mobile-toc__panel');
    await dialog.waitFor({ state: "visible" });
    const tocTab = dialog.locator('#fr-navigation-tab-toc');
    const seriesTab = dialog.locator('#fr-navigation-tab-series');
    assert.equal(await tocTab.textContent(), language === 'en' ? 'On this page' : '目录');
    assert.equal(await seriesTab.textContent(), language === 'en' ? 'Series articles' : '专题文章');
    assert.equal(await tocTab.getAttribute('aria-selected'), 'true');
    assert.equal(await dialog.locator('#fr-navigation-series').isHidden(), true);
    await page.screenshot({ path: path.join(output, 'navigation-toc-mobile-' + language + '-' + seriesUrl.split('/')[2] + '.png'), animations: 'disabled' });
    await tocTab.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await seriesTab.getAttribute('aria-selected'), 'true');
    assert.equal(await seriesTab.evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press('Home');
    assert.equal(await tocTab.getAttribute('aria-selected'), 'true');
    await seriesTab.click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.deepEqual(await dialog.locator('ol a').evaluateAll((links) => links.map((link) => link.getAttribute('href'))), expectedLinks);
    assert.equal(await dialog.locator('a[aria-current="page"]').getAttribute('href'), expectedLinks[currentIndex]);
    assert.equal(await dialog.locator('.fr-series-list').getAttribute('lang'), language === 'en' ? 'en-US' : 'zh-CN');
    const after = await page.evaluate(() => scrollY);
    assert.ok(Math.abs(after - before) < 80, seriesUrl + ': opening series moved reading position from ' + before + ' to ' + after);
    assert.equal(await page.locator('.initial-content').evaluate((element) => element.inert), true);
    await noOverflow();
    await page.screenshot({ path: path.join(output, 'series-mobile-' + language + '-' + seriesUrl.split('/')[2] + '.png'), animations: 'disabled' });
    const closeButton = dialog.locator('button[data-close-toc]');
    await closeButton.focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await dialog.locator('ol a').last().evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await closeButton.evaluate((element) => element === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
    assert.equal(await page.locator('.initial-content').evaluate((element) => element.inert), false);
    await trigger.click();
    assert.equal(await tocTab.getAttribute('aria-selected'), 'true', 'Reopening navigation should default to TOC');
    await page.locator('#fr-toc-panel .fr-mobile-toc__shade').click({ position: { x: 2, y: 2 } });
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await trigger.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await page.locator('#fr-toc-panel').getAttribute('aria-hidden'), 'true');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 900 });
    await trigger.click();
    await seriesTab.click();
    await dialog.locator('ol a').first().click();
    await page.waitForURL(base + expectedLinks[0]);
    assert.equal(await page.locator('.fr-article-series-rail a[aria-current="page"]').getAttribute('href'), expectedLinks[0]);
    assert.equal(await page.locator('.fr-series-next a[rel="next"]').getAttribute('href'), expectedLinks[1]);
    assert.equal(await page.locator('.fr-series-next a[rel="prev"]').count(), 0);
  }
  await goto('/人格成长/人力资源/HR-Interview/');
  assert.equal(await page.locator('.fr-reader-tools__btn--series').count(), 0, 'Independent articles have no series button');
  console.log('Series membership, mobile dialog, focus, reading position and adjacent links passed.');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await goto("/categories/");
    await page.locator(".fr-category-directory").evaluate((e) => e.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(output, `category-filter-${width}.png`), animations: "disabled" });
  }
  await page.setViewportSize({ width: 1440, height: 900 });

  await goto("/about/");
  for (const language of ["en", "zh", "en", "zh"]) {
    await page.locator(`[data-fr-ui-lang-option="${language}"]`).click();
    const menus = await page.locator(".toc__menu").evaluateAll((menus) => menus.map((menu) => [...menu.querySelectorAll("a")].filter((a) => !a.hidden).map((a) => a.hash)));
    assert.ok(menus.length >= 2);
    menus.slice(1).forEach((menu) => assert.deepEqual(menu, menus[0]));
    const links = await page.locator(".greedy-nav .visible-links a, .greedy-nav .hidden-links a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    assert.equal(new Set(links).size, links.length, "Duplicate header navigation");
    assert.ok(links.includes("/tags/"));
  }
  await goto("/阅相识人/企业剖析/ai/AI-advancegroup-1/");
  assert.equal(await page.evaluate(() => jQuery.fn.jquery), "4.0.0");
  const lightboxLinks = page.locator(".page__content a.image-popup");
  assert.ok(await lightboxLinks.count() > 1, "Lightbox regression needs real article gallery links");
  const imageFixture = await fs.readFile(path.join(root, "assets/img/page-header-image-manufacture-teaser.jpg"));
  await page.route("https://fastly.jsdelivr.net/gh/kewtgh/PicSunflowers@main/**", (route) => route.fulfill({ status: 200, contentType: "image/jpeg", body: imageFixture }));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await lightboxLinks.first().click();
    await page.locator(".mfp-wrap").waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector(".mfp-img")?.naturalWidth > 0);
    assert.ok(await page.evaluate(() => Number(getComputedStyle(document.querySelector(".mfp-wrap")).zIndex) > Number(getComputedStyle(document.querySelector(".fr-reader-tools")).zIndex)), "Reader tools must not appear over an image dialog");
    const firstSource = await page.locator(".mfp-img").getAttribute("src");
    await page.keyboard.press("ArrowRight");
    assert.notEqual(await page.locator(".mfp-img").getAttribute("src"), firstSource);
    await page.locator(".mfp-arrow-left").click();
    assert.equal(await page.locator(".mfp-img").getAttribute("src"), firstSource);
    await page.screenshot({ path: path.join(output, `lightbox-${width}.png`), animations: "disabled" });
    await page.keyboard.press("Escape");
    await page.locator(".mfp-wrap").waitFor({ state: "hidden" });
    assert.equal(await lightboxLinks.first().evaluate((e) => document.activeElement === e), true);
  }
  await page.unroute("https://fastly.jsdelivr.net/gh/kewtgh/PicSunflowers@main/**");
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(article);
  const noteReference = page.locator('.page__content a.footnote[rel="footnote"]').first();
  await noteReference.scrollIntoViewIfNeeded();
  await noteReference.hover();
  await page.locator('.fr-footnote-preview').waitFor({ state: 'visible' });
  const previewColors = await page.locator('.fr-footnote-preview').evaluate((element) => ({ popup: getComputedStyle(element).backgroundColor, page: getComputedStyle(document.body).backgroundColor }));
  assert.notEqual(previewColors.popup, previewColors.page, 'Footnote surface should differ from the article background');
  assert.match(await page.locator('.fr-footnote-preview').textContent(), /Repo 105/);
  assert.equal(await page.locator('.fr-footnote-preview .reversefootnote').count(), 0);
  assert.ok((await noteReference.getAttribute('aria-describedby')).includes('fr-footnote-preview'));
  assert.equal(new URL(page.url()).hash, '', 'Hovering should not navigate to the footnote');
  await page.screenshot({ path: path.join(output, 'footnote-preview-desktop.png'), animations: 'disabled' });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.fr-footnote-preview').isHidden(), true);
  await noteReference.focus();
  await page.locator('.fr-footnote-preview').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await noteReference.click();
  assert.ok(new URL(page.url()).hash.startsWith('#fn:'), 'Clicking should retain the original footnote jump');
  assert.equal(await page.locator('.fr-footnote-preview').isHidden(), true, 'Following a note should dismiss its preview');
  for (const [url, width, language] of [[article, 1440, 'zh'], [article, 390, 'zh'], [englishFootnotes, 390, 'en'],
    [japanArticles[0], 1440, 'zh'], [japanArticles[0], 390, 'zh'], [japanArticles[1], 1440, 'en'], [japanArticles[1], 390, 'en']]) {
    await page.setViewportSize({ width, height: 900 });
    await goto(url);
    await page.locator(`[data-fr-ui-lang-option="${language}"]`).click();
    const caseSuffix = japanArticles.includes(url) ? '-japan' : '';
    if (caseSuffix) {
      assert.equal(await page.locator('.page__content a.footnote').count(), 16, 'Japan: every reference must render');
      assert.equal(await page.locator('.page__content .footnotes > ol > li').count(), 16, 'Japan: every note must remain visible');
    }
    const reference = page.locator('.page__content a.footnote').first();
    const dimensions = await page.locator('.page__content a.footnote').evaluateAll((links) => links.map((link) => {
      const rect = link.getBoundingClientRect();
      return { number: link.textContent.trim(), indent: getComputedStyle(link).textIndent, ratio: rect.width / rect.height };
    }));
    dimensions.forEach((badge) => {
      assert.equal(badge.indent, '0px', 'Footnote badges must not inherit paragraph indentation');
      if (badge.number.length === 1) assert.ok(badge.ratio <= 1.15, `Stretched footnote badge: ${JSON.stringify(badge)}`);
    });
    const noteId = decodeURIComponent((await reference.getAttribute('href')).slice(1));
    const note = page.locator(`[id="${noteId}"]`);
    const numberLink = note.locator('a.fr-footnote-index');
    const originalBacklink = note.locator('a.reversefootnote:not(.fr-footnote-index)').first();
    assert.equal(await numberLink.getAttribute('href'), await originalBacklink.getAttribute('href'));
    assert.match(await numberLink.getAttribute('aria-label'), language === 'en' ? /Return to note/ : /返回正文注释/);
    if (width < 1024) {
      await reference.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const before = await page.evaluate(() => ({ scroll: scrollY, hash: location.hash }));
      await reference.click();
      const popup = page.locator('.fr-footnote-preview');
      await popup.waitFor({ state: 'visible' });
      assert.equal(await popup.evaluate((element) => getComputedStyle(element).backgroundColor), previewColors.popup);
      assert.equal(await popup.getAttribute('role'), 'dialog');
      assert.equal(new URL(page.url()).hash, before.hash, 'Mobile notes should not change the URL');
      const afterOpen = await page.evaluate(() => scrollY);
      assert.ok(Math.abs(afterOpen - before.scroll) < 5, `Opening a note moved reading position on ${url} from ${before.scroll} to ${afterOpen}`);
      const expectedNote = await note.evaluate((element) => {
        const clone = element.cloneNode(true);
        clone.querySelectorAll('.reversefootnote').forEach((link) => link.remove());
        return clone.textContent.trim();
      });
      assert.equal((await popup.locator('.fr-footnote-preview__content').textContent()).trim(), expectedNote);
      assert.equal(await popup.locator('.reversefootnote').count(), 0);
      await noOverflow();
      await page.screenshot({ path: path.join(output, `footnote-popup-mobile-${language}${caseSuffix}.png`), animations: 'disabled' });
      await popup.locator('button').click();
      assert.equal(await popup.isHidden(), true);
      assert.equal(await reference.evaluate((element) => document.activeElement === element), true);
      assert.ok(Math.abs((await page.evaluate(() => scrollY)) - before.scroll) < 5);
      await reference.click();
      await page.keyboard.press('Escape');
      assert.equal(await popup.isHidden(), true);
      await reference.click();
      await page.mouse.click(1, 1);
      assert.equal(await popup.isHidden(), true, 'Tapping outside should dismiss the note');
    }
    const visitFootnoteList = async () => {
      if (width < 1024) await page.evaluate((hash) => { location.hash = hash; }, await reference.getAttribute('href'));
      else await reference.click();
    };
    await visitFootnoteList();
    await numberLink.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `footnote-list-${language}-${width}${caseSuffix}.png`), animations: 'disabled' });
    for (const backlink of [numberLink, originalBacklink]) {
      await backlink.click();
      await page.waitForFunction(() => document.activeElement?.matches('a.footnote'));
      assert.equal(new URL(page.url()).hash, await backlink.getAttribute('href'));
      const rect = await reference.boundingBox();
      assert.ok(rect.y >= 0 && rect.y < 900, 'The backlink must return the reference into view');
      await visitFootnoteList();
    }
    await numberLink.click();
    await page.keyboard.press('Escape');
    await page.screenshot({ path: path.join(output, `footnote-badge-${language}-${width}${caseSuffix}.png`), animations: 'disabled' });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  console.log('Compact footnotes and numbered/arrow return links passed on desktop, mobile and English articles.');
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await touchContext.route('**/*', (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror', (error) => errors.push(error.stack || error.message));
    await touchPage.goto(base + article);
    const reference = touchPage.locator('.page__content a.footnote').first();
    await reference.scrollIntoViewIfNeeded();
    await touchPage.waitForTimeout(200);
    const before = await touchPage.evaluate(() => ({ scroll: scrollY, hash: location.hash }));
    await reference.tap();
    const popup = touchPage.locator('.fr-footnote-preview');
    await popup.waitFor({ state: 'visible' });
    assert.equal(new URL(touchPage.url()).hash, before.hash);
    assert.ok(Math.abs((await touchPage.evaluate(() => scrollY)) - before.scroll) < 5);
    await touchPage.waitForTimeout(200);
    assert.equal(await popup.isVisible(), true, 'A tapped note should stay open until dismissed');
    await popup.locator('button').tap();
    assert.equal(await popup.isHidden(), true);
    assert.equal(await touchPage.locator('.fr-reader-tools button:visible').count(), 2);
    const navigation = touchPage.locator('#fr-toc-panel');
    const navigationButton = touchPage.locator('.fr-reader-tools__btn--toc');
    await navigationButton.tap();
    assert.equal(await navigation.locator('#fr-navigation-tab-toc').getAttribute('aria-selected'), 'true');
    await navigation.locator('#fr-navigation-tab-series').tap();
    assert.equal(await navigation.locator('#fr-navigation-series').isVisible(), true);
    assert.ok(Math.abs((await touchPage.evaluate(() => scrollY)) - before.scroll) < 5);
    await navigation.locator('button[data-close-toc]').tap();
    await navigationButton.tap();
    assert.equal(await navigation.locator('#fr-navigation-tab-toc').getAttribute('aria-selected'), 'true');
    await navigation.locator('button[data-close-toc]').tap();
  } finally { await touchContext.close(); }
  console.log('Mobile notes display in place with close, Escape, outside-click and touch support.');
  await goto(article);
  await page.locator('[data-fr-ui-lang-option="en"]').click();
  assert.match(await page.locator(".e-content").getAttribute("lang"), /^zh/);
  await page.waitForFunction(() => document.querySelectorAll('.fr-article-toc .fr-article-toc__nav [aria-current="true"]').length === 1);
  assert.equal(await page.locator('.fr-article-toc-mobile').count(), 0, "The in-flow TOC should be removed after the floating TOC is ready");
  assert.equal(await page.locator('#fr-toc-panel .fr-mobile-toc__panel [aria-current="true"]').count(), 1);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.fr-reader-tools__btn--toc').isVisible(), true);
  assert.equal(await page.locator('.fr-reader-tools__btn--toc span').textContent(), '≡');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight / 2));
  const readingPosition = await page.evaluate(() => scrollY);
  await page.locator('.fr-reader-tools__btn--toc').click();
  await page.locator('#fr-toc-panel .fr-mobile-toc__panel').waitFor({ state: "visible" });
  assert.equal(await page.locator('#fr-toc-panel .fr-mobile-toc__close span').textContent(), '×');
  assert.ok(await page.locator('#fr-toc-panel .fr-mobile-toc__panel .toc__menu ul a').count(), "Nested headings should remain available");
  assert.ok(await page.locator('#fr-toc-panel .fr-mobile-toc__panel [aria-current="true"]').count());
  assert.equal(await page.locator('#fr-toc-panel .fr-mobile-toc__panel .toc__menu a').filter({ hasText: 'Permalink' }).count(), 0);
  const positionAfterOpen = await page.evaluate(() => scrollY);
  assert.ok(Math.abs(positionAfterOpen - readingPosition) < 80, `Opening the TOC moved the article from ${readingPosition} to ${positionAfterOpen}`);
  await page.screenshot({ path: path.join(output, "article-mobile-toc.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator('#fr-toc-panel').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('.fr-reader-tools__btn--toc').evaluate((button) => document.activeElement === button), true);
  await page.locator('.fr-reader-tools__btn--toc').click();
  await page.locator('#fr-toc-panel .fr-mobile-toc__panel .toc__menu a').first().click();
  assert.equal(await page.locator('#fr-toc-panel').getAttribute('aria-hidden'), 'true');
  assert.ok(await page.evaluate(() => location.hash.length > 1));
  assert.equal(await page.locator('.fr-reader-tools__btn--top').isVisible(), true);
  await page.locator('.fr-reader-tools__btn--top').click();
  await page.waitForFunction(() => scrollY < 5);
  await page.setViewportSize({ width: 1440, height: 900 });
  console.log("Language, duplicate TOC, navigation and content-language checks passed.");

  let loadFailures = 0;
  await page.route("**/leaders-companies.json", (route) => loadFailures++ === 0 ? route.fulfill({ status: 503, body: "unavailable" }) : route.continue());
  await goto("/leaders-scorecard/");
  await page.locator("[data-retry-load]").waitFor();
  assert.equal(await page.locator("#leaders-pro, .leaders-entry-grid a[href^='mailto:']").count(), 0);
  assert.equal(await page.locator('.leaders-entry-grid a[href="#leaders-method"]').count(), 1);
  assert.equal(await page.locator("#leaders-company-input").isDisabled(), true);
  await page.locator("[data-retry-load]").click();
  await page.waitForFunction(() => !document.querySelector("#leaders-company-input").disabled);
  assert.equal(await page.locator(".leaders-result__head").count(), 0, "No arbitrary initial company");
  await page.unroute("**/leaders-companies.json");
  const search = async (name) => {
    await page.locator("#leaders-company-input").fill(name);
    await page.locator('#leaders-search-form button[type="submit"]').click();
  };
  await search("HBM");
  assert.equal(await page.locator(".leaders-suggestions button").count(), 2);
  await page.locator("#leaders-stage").selectOption("mature");
  assert.equal(await page.locator(".leaders-result__head").count(), 0);
  await search("NVIDIA");
  await page.locator("#leaders-company-input").fill("Apple");
  await page.locator('[data-fr-ui-lang-option="zh"]').click();
  await page.locator('[data-fr-ui-lang-option="en"]').click();
  assert.equal(await page.locator(".leaders-result__head h2").textContent(), "NVIDIA");
  await page.locator("#leaders-stage").selectOption("early");
  assert.equal(await page.locator(".leaders-result__head h2").textContent(), "NVIDIA");
  for (const [suffix, name] of [["a", "Apple"], ["b", "Microsoft"], ["c", "Tesla"]]) await page.locator(`#leaders-compare-${suffix}`).fill(name);
  await page.locator("[data-compare-company]").click();
  assert.equal(await page.locator("#leaders-compare-c").inputValue(), "Tesla");
  assert.match(await page.locator("#leaders-compare-output").textContent(), /full/);
  await page.locator(".leaders-calculation summary").click();
  assert.equal(await page.locator(".leaders-calculation tbody tr").count(), 7);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250); // allow the responsive nav's animation frame to settle
    await noOverflow();
    await page.locator(".leaders-calculation").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `score-explanation-${width}.png`) });
  }
  // Preserve existing print behavior; no new export/download feature is introduced.
  await page.evaluate(() => dispatchEvent(new Event("beforeprint")));
  assert.match(await page.locator("#leaders-print-only h1").textContent(), /NVIDIA/);
  await page.evaluate(() => dispatchEvent(new Event("afterprint")));
  assert.equal(await page.locator("#leaders-print-only").count(), 0);
  console.log("LEADERS retry, ambiguity, draft isolation, compare capacity, explanation, print checks passed.");
  await page.route("**/leaders-score-rubric.json", (route) => route.fulfill({ status: 200, contentType: "application/json", body: '{"version":"invalid","dimension_order":[]}' }));
  await goto("/leaders-scorecard/?company=NVIDIA");
  await page.locator("[data-retry-load]").waitFor();
  assert.equal(await page.locator(".leaders-result__head").count(), 0);
  await page.unroute("**/leaders-score-rubric.json");
  await page.locator("[data-retry-load]").click();
  await page.locator(".leaders-result__head").waitFor();
  console.log("Malformed runtime model is rejected and retry recovers.");
  await goto("/leaders-scorecard/?company=NVIDIA&stage=toString");
  await page.locator(".leaders-result__head").waitFor();
  assert.equal(await page.locator("#leaders-stage").inputValue(), "growth");
  await goto("/");
  await page.locator(".search__toggle").click();
  await page.locator("[data-fr-search-error]").first().waitFor();
  assert.ok(await page.locator('[data-fr-search-error] a[href="/posts/"]').count());
  await page.locator("[data-fr-search-error] button").first().click();
  await page.locator("[data-fr-search-error]").first().waitFor();
  console.log("Unavailable external search dependency has a visible retry and archive fallback.");
  // Opt-in network smoke: use real CDN libraries but never query the live index.
  if (process.env.FR_TEST_SEARCH_CDN === "1") {
    allowSearchCdn = true;
    let mockedSearchRequests = 0;
    const mockedQueries = [];
    let rejectMockedSearch = false;
    await page.route(/https:\/\/[^/]+\.algolia(?:net|\.net)\//, async (route) => {
      // Algolia v5 sends search parameters directly on each request.
      const requests = JSON.parse(route.request().postData() || "{}").requests || [];
      assert.ok(requests.length > 0, "Search should send at least one request");
      assert.ok(requests.every((request) => request.indexName && ["FaceReader", "Recovery query"].includes(request.query)), "Search should preserve the index and query in the v5 request");
      mockedSearchRequests += 1;
      mockedQueries.push(requests[0].query);
      if (rejectMockedSearch) return route.fulfill({ status: 403, contentType: "application/json", body: '{"message":"Mocked search unavailable","status":403}' });
      const results = requests.map((request) => ({
        hits: [{ objectID: "smoke", title: "FaceReader search smoke", url: "/posts/", teaser: "/assets/img/page-header-image-manufacture-teaser.jpg", description: "Local fixture, not a live index query." }],
        index: request.indexName, params: new URLSearchParams({ query: request.query }).toString(),
        nbHits: 1, page: 0, nbPages: 1, hitsPerPage: 20, processingTimeMS: 1,
        query: request.query, exhaustiveNbHits: true
      }));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results }) });
    });
    await goto("/");
    await page.locator(".search__toggle").click();
    await page.locator(".search-content .ais-SearchBox-input").fill("FaceReader");
    try {
      await page.locator(".search-content .algolia-hit__title").first().waitFor();
    } catch (error) {
      await page.screenshot({ path: path.join(output, "search-dependency-failure.png"), fullPage: true });
      console.error({ mockedSearchRequests, errors, searchText: await page.locator(".search-content").textContent() });
      throw error;
    }
    assert.equal(await page.locator(".search-content .algolia-hit__title").first().textContent(), "FaceReader search smoke");
    rejectMockedSearch = true;
    await page.locator(".search-content .ais-SearchBox-input").fill("Recovery query");
    await page.locator(".search-content [data-fr-search-error]").waitFor();
    rejectMockedSearch = false;
    await Promise.all([
      page.waitForResponse(response => /\.algolia(?:net|\.net)\//.test(response.url()) && response.status() === 200),
      page.locator(".search-content [data-fr-search-error] button").click()
    ]);
    assert.equal(mockedQueries.at(-1), "Recovery query", "Retry must preserve the failed query instead of a previous result");
    assert.equal(await page.locator(".search-content .ais-SearchBox-input").inputValue(), "Recovery query");
    assert.equal(await page.locator(".search-content [data-fr-search-error]").count(), 0);
    console.log("Updated CDN search libraries render mocked results; no live index request was sent.");
  }
  assert.deepEqual(errors, [], "Uncaught browser exceptions");
  }
  await testReadingFeatures({ browser, base, output, siteRoot: root });
  await testPublicationFeatures({ browser, base, root, output });
  console.log(`Browser regression passed. Screenshots: ${output}`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
