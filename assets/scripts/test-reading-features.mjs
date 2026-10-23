import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

export async function testReadingFeatures({ browser, base, output, siteRoot }) {
  const catalog = JSON.parse(await fs.readFile(path.join(siteRoot, "article-index.json"), "utf8")).posts;
  const article = catalog.find(post => post.language === "zh");
  const english = catalog.find(post => post.language === "en");
  const savedKey = "facereader.readingList.v1";
  const consentKey = "facereader.analyticsConsent.v1";
  const context = await browser.newContext({ timezoneId: "Asia/Taipei", reducedMotion: "reduce" });
  const errors = [];
  const optionalRequests = [];
  await context.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  context.on("request", request => { if (/googletagmanager\.com\/gtag|\.disqus\.com\/embed/.test(request.url())) optionalRequests.push(request.url()); });
  const page = await context.newPage();
  const goto = url => page.goto(base + url);
  const waitCatalog = () => page.waitForFunction(() => document.querySelector("[data-fr-local-search], [data-fr-reading-list]")?.getAttribute("aria-busy") === "false");
  const noOverflow = async () => {
    const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")].filter(element => { const box = element.getBoundingClientRect(); return box.width && box.right > innerWidth + 1 && getComputedStyle(element).position !== "fixed"; }).slice(0, 12).map(element => `${element.tagName}.${element.className}`) }));
    assert.ok(geometry.scroll <= geometry.width + 1, `${page.url()} ${JSON.stringify(geometry)}`);
  };
  try {
    await goto(article.url);
    assert.deepEqual(optionalRequests, [], "Analytics and comments must not load on a first visit");
    const save = page.locator("[data-fr-save-article]");
    await save.click();
    assert.equal(await save.getAttribute("aria-pressed"), "true");
    const listPage = await context.newPage();
    await listPage.goto(base + "/reading-list/");
    await listPage.locator(".fr-library__card").waitFor();
    assert.equal(await listPage.locator(".fr-library__card h2").textContent(), article.title);
    await listPage.locator(".fr-library__card button").click();
    await page.waitForFunction(() => document.querySelector("[data-fr-save-article]").getAttribute("aria-pressed") === "false");
    assert.equal(await listPage.locator(".fr-library__card").count(), 0);
    await listPage.close();

    await page.evaluate(({ key, url }) => localStorage.setItem(key, JSON.stringify([url, url, "//evil.example/", "javascript:alert(1)"])), { key: savedKey, url: article.url });
    await goto("/reading-list/");
    await waitCatalog();
    assert.equal(await page.locator(".fr-library__card").count(), 1);
    assert.equal(await page.locator('.fr-library__card a[href^="//"]').count(), 0);
    await page.evaluate(key => localStorage.setItem(key, "broken JSON"), savedKey);
    await page.reload();
    await waitCatalog();
    assert.equal(await page.locator(".fr-library__card").count(), 0);
    await goto(article.url);
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify(Array.from({ length: 100 }, (_, i) => `/synthetic/${i}/`))), savedKey);
    await save.click();
    assert.equal(await save.getAttribute("aria-pressed"), "false");
    assert.match(await page.locator("[data-fr-save-status]").textContent(), /100/);
    await goto("/reading-list/");
    await waitCatalog();
    await page.locator("[data-fr-clear-unavailable]").click();
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, savedKey), 0);
    await goto(article.url);
    await save.click();

    await page.evaluate(() => {
      const content = document.querySelector(".page__content").getBoundingClientRect();
      scrollTo(0, scrollY + content.bottom - innerHeight + 10);
    });
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector(".fr-reading-progress i")).transform.split("(")[1].split(",")[0]) > .99);

    let failures = 0;
    await page.route("**/article-index.json", route => failures++ === 0 ? route.fulfill({ status: 503, body: "unavailable" }) : route.continue());
    await goto(`/search/?q=${encodeURIComponent(english.title)}&lang=en`);
    await page.locator("[data-fr-catalog-retry]:not([hidden])").waitFor();
    await page.locator("[data-fr-catalog-retry]").click();
    await page.locator(".fr-library__card").first().waitFor();
    await waitCatalog();
    assert.equal(await page.locator("[data-fr-catalog-retry]").isVisible(), false);
    assert.equal(await page.locator("#local-language").inputValue(), "en");
    assert.equal(await page.locator(".fr-library__card").evaluateAll(cards => cards.every(card => card.lang === "en")), true);
    assert.ok((await page.locator(".fr-library__card h2").allTextContents()).includes(english.title));
    await page.unroute("**/article-index.json");
    assert.equal(await page.locator(".fr-reading-progress").count(), 0);

    await page.locator("#local-query").fill("missing-article-20261024-xyz");
    await page.locator("#local-query").press("Enter");
    assert.equal(new URL(page.url()).searchParams.get("q"), "missing-article-20261024-xyz");
    assert.equal(await page.locator(".fr-library__card").count(), 0);
    await page.goBack();
    await page.waitForFunction(title => document.querySelector("#local-query").value === title, english.title);
    assert.ok(await page.locator(".fr-library__card").count());
    await page.goForward();
    assert.equal(await page.locator(".fr-library__card").count(), 0);
    await page.locator("[data-fr-search-clear]").click();
    assert.equal(await page.locator("#local-query").inputValue(), "");
    const topic = english.categories[0];
    await page.locator("#local-category").selectOption(topic);
    const links = await page.locator(".fr-library__card h2 a").evaluateAll(links => links.map(link => link.getAttribute("href")));
    assert.ok(links.length);
    assert.equal(links.every(url => catalog.find(post => post.url === url)?.categories.includes(topic)), true);
    await page.locator('[data-fr-ui-lang-option="en"]').click();
    assert.equal(await page.locator("#page-title").textContent(), "Find articles");
    await page.locator('[data-fr-ui-lang-option="zh"]').click();
    await page.locator("[data-fr-search-clear]").click();
    assert.equal(await page.locator(".fr-library__card").count(), 12);
    await page.locator("[data-fr-library-more]").click();
    assert.equal(await page.locator(".fr-library__card").count(), 24);

    for (const width of [1440, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const language of ["zh", "en"]) {
        await goto(`/search/?lang=${language}`);
        await waitCatalog();
        await page.locator(`[data-fr-ui-lang-option="${language}"]`).click();
        await noOverflow();
        const searchTarget = await page.locator(".search__toggle").boundingBox();
        assert.ok(searchTarget.width >= 44 && searchTarget.height >= 44, "Search needs a usable touch target");
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#main")).opacity === "1");
        if ([1440, 390].includes(width)) await page.screenshot({ path: path.join(output, `local-search-${language}-${width}.png`), animations: "disabled" });
        await goto("/reading-list/");
        await waitCatalog();
        assert.equal(await page.locator("[data-fr-clear-unavailable]").isVisible(), false);
        await noOverflow();
        if ([1440, 390].includes(width)) await page.screenshot({ path: path.join(output, `reading-list-${language}-${width}.png`), animations: "disabled" });
        await goto("/404.html");
        assert.equal(await page.locator('#main form').getAttribute("action"), "/search/");
        await noOverflow();
        if (width === 390) await page.screenshot({ path: path.join(output, `404-${language}-${width}.png`), animations: "disabled" });
      }
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await goto(article.url);
    await page.screenshot({ path: path.join(output, "article-save-mobile.png"), animations: "disabled" });
    let commentAttempts = 0;
    await page.route("**/*.disqus.com/embed.js", route => ++commentAttempts === 1 ? route.abort() : route.fulfill({ contentType: "application/javascript", body: "window.__frCommentsLoaded = true;" }));
    await page.locator("[data-fr-disqus] button").click();
    await page.waitForFunction(() => document.querySelector("[data-fr-disqus]").dataset.frCommentState === "failed");
    await page.locator("[data-fr-disqus] button").click();
    await page.waitForFunction(() => window.__frCommentsLoaded === true);
    assert.equal(commentAttempts, 2);
    await goto(article.url);
    assert.equal(commentAttempts, 2, "Comments must require a new choice on every page");
    let analytics = 0;
    await page.route("**/www.googletagmanager.com/gtag/**", route => { analytics++; return route.fulfill({ contentType: "application/javascript", body: "window.__frAnalyticsLoaded = true;" }); });
    await page.locator("#privacy-settings summary").click();
    await page.locator("#fr-analytics-consent").check();
    await Promise.all([page.waitForEvent("load"), page.locator("[data-fr-privacy-form] button").click()]);
    await page.waitForFunction(() => window.__frAnalyticsLoaded === true);
    assert.equal(analytics, 1);
    await goto(`/search/?q=${encodeURIComponent(article.title)}&lang=zh`);
    await waitCatalog();
    assert.equal(analytics, 1, "Local search must not load analytics");
    await page.locator(".fr-library__card h2 a").first().click();
    await page.waitForFunction(() => window.__frAnalyticsLoaded === true);
    assert.equal(analytics, 2);
    const analyticsConfig = await page.evaluate(() => Array.from(window.dataLayer.find(event => event[0] === "config"))[2]);
    assert.equal(analyticsConfig.page_referrer, base + "/search/", "Search parameters must not leak via analytics referrers");
    assert.equal(analyticsConfig.page_location.includes("?"), false);
    await page.locator("#privacy-settings summary").click();
    await page.locator("#fr-analytics-consent").uncheck();
    assert.equal(await page.locator(".fr-reader-tools").isVisible(), false, "Privacy controls must not be covered by reading tools");
    await page.locator("[data-fr-privacy-form]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, "privacy-mobile.png"), animations: "disabled" });
    await Promise.all([page.waitForEvent("load"), page.locator("[data-fr-privacy-form] button").click()]);
    assert.equal(analytics, 2, "Analytics must remain off after withdrawal");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), consentKey), "disabled");
    assert.deepEqual(errors, []);
  } catch (error) {
    console.error({ url: page.url(), status: await page.locator("[data-fr-library-status]").allTextContents(),
      query: await page.locator("#local-query").inputValue().catch(() => ""), language: await page.locator("#local-language").inputValue().catch(() => ""), errors });
    await page.screenshot({ path: path.join(output, "reading-feature-failure.png"), fullPage: true });
    throw error;
  } finally { await context.close(); }

  for (const signal of ["globalPrivacyControl", "doNotTrack", "storageBlocked"]) {
    const visitor = await browser.newContext({ timezoneId: "Asia/Taipei" });
    const requests = [];
    await visitor.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    visitor.on("request", request => { if (/googletagmanager\.com\/gtag|\.disqus\.com\/embed/.test(request.url())) requests.push(request.url()); });
    await visitor.addInitScript(({ signal, key }) => {
      if (signal === "storageBlocked") Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } });
      else {
        localStorage.setItem(key, "enabled");
        Object.defineProperty(navigator, signal, { get() { return signal === "globalPrivacyControl" ? true : "1"; } });
      }
    }, { signal, key: consentKey });
    try {
      const blocked = await visitor.newPage();
      const errors = [];
      blocked.on("pageerror", error => errors.push(error.message));
      await blocked.goto(base + article.url);
      assert.deepEqual(requests, [], signal);
      if (signal === "storageBlocked") {
        assert.equal(await blocked.locator("[data-fr-save-article]").isDisabled(), true);
        await blocked.goto(base + "/reading-list/");
        await blocked.waitForFunction(() => document.querySelector("[data-fr-reading-list]")?.getAttribute("aria-busy") === "false");
        assert.match(await blocked.locator("[data-fr-library-status]").textContent(), /存储|storage/i);
      } else assert.equal(await blocked.locator("#fr-analytics-consent").isDisabled(), true);
      assert.deepEqual(errors, []);
    } finally { await visitor.close(); }
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  await noJs.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  try {
    const fallback = await noJs.newPage();
    await fallback.goto(base + "/search/");
    assert.equal(await fallback.locator('noscript a[href="/posts/"]').isVisible(), true);
  } finally { await noJs.close(); }
  console.log("Local search, URL history, saved articles, storage failures, content progress, privacy choices, comment retry and 320–1440px bilingual layouts passed.");
}
