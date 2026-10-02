// Run after site:build. Uses an installed Playwright; does not download browsers.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve("_site");
const output = path.resolve("tmp/audit-2026-10-03");
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
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const goto = (url) => page.goto(base + url);
  const noOverflow = async () => {
    const result = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")].filter((e) => {
        const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(e).position !== "fixed";
      }).slice(0, 12).map((e) => `${e.tagName}.${e.className}`) }));
    if (result.scrollWidth > result.width + 1) await page.screenshot({ path: path.join(output, "overflow.png") });
    assert.ok(result.scrollWidth <= result.width + 1, `Horizontal overflow: ${page.url()} ${JSON.stringify(result)}`);
  };
  const article = "/人格成长/不靠谱领导力/manage-leadership12/";
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const url of ["/", "/posts/", "/categories/", "/tags/", "/most_popular/", "/about/", "/leaders-scorecard/", "/darwin-leaders-benchmark/", article, "/social commentary/Society-lcer-canada-en/"]) {
      const response = await goto(url);
      assert.equal(response.status(), 200, url);
      await page.waitForTimeout(150);
      await noOverflow();
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
  await goto("/categories/");
  await page.locator("#category-filter").fill("孙子");
  assert.equal(await page.locator(".fr-category-directory li:not([hidden])").count(), 1);
  await page.locator("#category-filter").fill("no-such-category");
  assert.equal(await page.locator(".fr-category-directory li:not([hidden])").count(), 0);
  await page.locator("#category-filter").fill("");
  let failures = 0;
  await page.route("**/category-index.json", (route) => failures++ === 0 ? route.fulfill({ status: 503, body: "unavailable" }) : route.continue());
  await page.locator(".fr-category-directory a").first().click();
  await page.locator("#category-detail-retry:not([hidden])").waitFor();
  await page.locator("#category-detail-retry").click();
  await page.locator("#category-detail-posts li").first().waitFor();
  assert.ok(await page.locator("#category-detail-posts img").count());
  await page.unroute("**/category-index.json");
  // A pending category response must not undo navigation back to the map.
  await goto("/categories/");
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("**/category-index.json", async (route) => { await gate; await route.continue(); });
  await page.locator(".fr-category-directory a").first().click();
  await page.waitForFunction(() => document.querySelector("#category-detail").getAttribute("aria-busy") === "true");
  await page.evaluate(() => { location.hash = "page-title"; });
  await page.waitForFunction(() => document.querySelector("#category-detail").hidden);
  release();
  await page.waitForTimeout(200);
  assert.equal(await page.locator("#category-detail").evaluate((e) => e.hidden), true);
  await page.unroute("**/category-index.json");
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
  await goto(article);
  const noteReference = page.locator('.page__content a.footnote[rel="footnote"]').first();
  await noteReference.scrollIntoViewIfNeeded();
  await noteReference.hover();
  await page.locator('.fr-footnote-preview').waitFor({ state: 'visible' });
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
  await goto(article);
  await page.locator('[data-fr-ui-lang-option="en"]').click();
  assert.match(await page.locator(".e-content").getAttribute("lang"), /^zh/);
  await page.waitForFunction(() => document.querySelectorAll('.fr-article-toc .fr-article-toc__nav [aria-current="true"]').length === 1);
  assert.equal(await page.locator('.fr-article-toc-mobile').count(), 0, "The in-flow TOC should be removed after the floating TOC is ready");
  assert.equal(await page.locator('.fr-mobile-toc__panel [aria-current="true"]').count(), 1);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.fr-reader-tools__btn--toc').isVisible(), true);
  assert.equal(await page.locator('.fr-reader-tools__btn--toc span').textContent(), '≡');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight / 2));
  const readingPosition = await page.evaluate(() => scrollY);
  await page.locator('.fr-reader-tools__btn--toc').click();
  await page.locator('.fr-mobile-toc__panel').waitFor({ state: "visible" });
  assert.equal(await page.locator('.fr-mobile-toc__close span').textContent(), '×');
  assert.ok(await page.locator('.fr-mobile-toc__panel .toc__menu ul a').count(), "Nested headings should remain available");
  assert.ok(await page.locator('.fr-mobile-toc__panel [aria-current="true"]').count());
  assert.equal(await page.locator('.fr-mobile-toc__panel .toc__menu a').filter({ hasText: 'Permalink' }).count(), 0);
  const positionAfterOpen = await page.evaluate(() => scrollY);
  assert.ok(Math.abs(positionAfterOpen - readingPosition) < 80, `Opening the TOC moved the article from ${readingPosition} to ${positionAfterOpen}`);
  await page.screenshot({ path: path.join(output, "article-mobile-toc.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator('.fr-mobile-toc').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('.fr-reader-tools__btn--toc').evaluate((button) => document.activeElement === button), true);
  await page.locator('.fr-reader-tools__btn--toc').click();
  await page.locator('.fr-mobile-toc__panel .toc__menu a').first().click();
  assert.equal(await page.locator('.fr-mobile-toc').getAttribute('aria-hidden'), 'true');
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
  assert.deepEqual(errors, [], "Uncaught browser exceptions");
  console.log(`Browser regression passed. Screenshots: ${output}`);
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
