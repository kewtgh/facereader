import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

export async function testReadingFeatures({ browser, base, output, siteRoot }) {
  const savedKey = "facereader.readingList.v1";
  const context = await browser.newContext({ timezoneId: "Asia/Taipei", reducedMotion: "reduce" });
  const errors = [];
  const serviceRequests = [];
  await context.route("**/*", route => {
    const url = route.request().url();
    const request = new URL(url);
    if (request.pathname.endsWith("/reading-list-data.mjs") && !request.search) return route.fulfill({ contentType: "text/javascript", body: "export const readSaved = () => []; export const validPath = () => true; export const readingListKey = 'legacy'; export const readingListLimit = 100;" });
    if (request.origin === base) return route.continue();
    if (/googletagmanager\.com\/gtag/.test(url)) return route.fulfill({ contentType: "application/javascript", body: "window.__frAnalyticsLoaded = true;" });
    return route.abort();
  });
  context.on("page", page => page.on("pageerror", error => errors.push(error.message)));
  context.on("request", request => { if (/googletagmanager\.com\/gtag|\.disqus\.com\/embed/.test(request.url())) serviceRequests.push(request.url()); });
  const page = await context.newPage();
  const goto = async (url, options) => {
    await page.goto(base + url, options);
    await page.evaluate(() => document.fonts.ready);
  };
  const waitList = () => page.waitForFunction(() => document.querySelector("[data-fr-reading-list]")?.dataset.frReady === "true");
  const setLanguage = language => page.locator(`[data-fr-ui-lang-option="${language}"]`).click();
  const noOverflow = async () => {
    const size = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(size.scroll <= size.width + 1, `${page.url()} ${JSON.stringify(size)}`);
  };
  const layout = () => page.evaluate(() => ["#main", "#main > .archive", ".fr-posts-layout", ".fr-posts-list", ".fr-archive-rail"].map(selector => {
    const box = document.querySelector(selector).getBoundingClientRect();
    return { selector, x: box.x, width: box.width };
  }));
  async function checkFooter() {
    const footer = page.locator("#footer");
    assert.equal(await footer.locator(".page__footer-follow").count(), 1);
    for (const href of ["/feed/zh.xml", "/feed/en.xml", "https://x.com/", "https://facebook.com/", "https://linkedin.com/"]) {
      assert.equal(await footer.locator(`.page__footer-follow a[href="${href}"]`).count(), 1, href);
    }
    assert.equal(await footer.locator('#privacy-settings, a[href="/search/"], a[href="/reading-list/"]').count(), 0);
    const feedRows = await footer.locator('.page__footer-feeds a').evaluateAll(links => links.map(link => link.getBoundingClientRect().top));
    assert.equal(feedRows[0], feedRows[1], "Chinese and English feeds must stay together");
  }
  let article;
  let english;
  try {
    await goto("/reading-list/");
    await waitList();
    const posts = await page.locator("template[data-fr-reading-template]").evaluateAll(templates => templates.map(template => ({
      url: template.dataset.frReadingTemplate,
      title: template.content.querySelector("h3").textContent.trim(),
      language: template.content.querySelector("article").lang.slice(0, 2)
    })));
    article = posts.find(post => post.language === "zh");
    english = posts.find(post => post.language === "en");
    assert.ok(article && english);
    assert.equal(serviceRequests.length, 0, "Reading lists must not load analytics or comments");
    for (const removed of ["article-index.json", "search/index.html", "assets/js/privacy-controls.js", "assets/js/catalog-search.mjs"]) {
      await assert.rejects(fs.access(path.join(siteRoot, removed)), { code: "ENOENT" });
    }
    await goto(article.url);
    await page.waitForFunction(() => window.__frAnalyticsLoaded === true);
    assert.equal(serviceRequests.filter(url => url.includes("disqus")).length, 0);
    const save = page.locator("[data-fr-save-article]");
    await save.click();
    assert.equal(await save.getAttribute("aria-pressed"), "true");
    assert.equal(await save.locator("svg").count(), 1, "Saving must preserve the button icon");
    const listPage = await context.newPage();
    await listPage.goto(base + "/reading-list/");
    await listPage.locator(".fr-saved-entry .fr-posts-card").waitFor();
    assert.equal((await listPage.locator(".fr-saved-entry h3").textContent()).trim(), article.title);
    await listPage.locator("[data-fr-saved-remove]").click();
    await page.waitForFunction(() => document.querySelector("[data-fr-save-article]").getAttribute("aria-pressed") === "false");
    assert.equal(await listPage.locator(".fr-saved-entry").count(), 0);
    assert.equal(await listPage.locator("[data-fr-library-status]").evaluate(element => document.activeElement === element), true);
    await listPage.close();

    await page.evaluate(({ key, url }) => localStorage.setItem(key, JSON.stringify([url, url, "//evil.example/", "javascript:alert(1)"])), { key: savedKey, url: article.url });
    await goto("/reading-list/");
    await waitList();
    assert.equal(await page.locator(".fr-saved-entry").count(), 1);
    assert.equal(await page.locator('.fr-saved-entry a[href^="//"]').count(), 0);
    await page.evaluate(key => localStorage.setItem(key, "broken JSON"), savedKey);
    await page.reload();
    await waitList();
    assert.equal(await page.locator(".fr-saved-entry").count(), 0);
    await page.evaluate(key => localStorage.setItem(key, JSON.stringify(Array.from({ length: 100 }, (_, i) => `/unavailable/${i}/`))), savedKey);
    await goto(article.url);
    await save.click();
    assert.equal(await save.getAttribute("aria-pressed"), "false");
    assert.match(await page.locator("[data-fr-save-status]").textContent(), /100/);
    await goto("/reading-list/");
    await waitList();
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, savedKey), 100, "Unavailable URLs remain until explicit cleanup");
    const uploadBackup = async value => {
      await page.locator("[data-fr-reading-file]").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(typeof value === "string" ? value : JSON.stringify(value)) });
      await page.waitForFunction(() => document.querySelector("[data-fr-reading-list]").getAttribute("aria-busy") === "false");
    };
    await uploadBackup({ format: "facereader.readingList", version: 1, urls: [article.url] });
    assert.match(await page.locator("[data-fr-transfer-status]").textContent(), /100/);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, savedKey), 100);
    await page.locator("[data-fr-clear-unavailable]").click();
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).length, savedKey), 0);
    await uploadBackup({ format: "facereader.readingList", version: 1, urls: [article.url, english.url, article.url, "/missing-article/"] });
    assert.equal(await page.locator(".fr-saved-entry").count(), 2);
    const savedBeforeImport = await page.evaluate(key => localStorage.getItem(key), savedKey);
    await uploadBackup("not valid JSON");
    assert.equal(await page.evaluate(key => localStorage.getItem(key), savedKey), savedBeforeImport);
    await uploadBackup({ format: "facereader.readingList", version: 1, urls: ["https://evil.example/"] });
    assert.equal(await page.evaluate(key => localStorage.getItem(key), savedKey), savedBeforeImport);
    await uploadBackup(" ".repeat(102401));
    assert.match(await page.locator("[data-fr-transfer-status]").textContent(), /100KB/);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), savedKey), savedBeforeImport);
    const downloadEvent = page.waitForEvent("download");
    await page.locator("[data-fr-reading-export]").click();
    const download = await downloadEvent;
    const backupFile = path.join(output, "reading-list-backup.json");
    await download.saveAs(backupFile);
    const backup = JSON.parse(await fs.readFile(backupFile, "utf8"));
    assert.equal(backup.format, "facereader.readingList");
    assert.deepEqual(backup.urls, [article.url, english.url]);
    await page.evaluate(({ key, urls }) => localStorage.setItem(key, JSON.stringify(urls)), { key: savedKey, urls: [article.url, english.url] });

    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const language of ["zh", "en"]) {
        await goto("/posts/");
        await setLanguage(language);
        await checkFooter();
        await noOverflow();
        assert.equal(await page.locator('.fr-editorial-head__nav a[href="/reading-list/"]').textContent(), language === "zh" ? "稍后阅读" : "Read later");
        assert.equal(await page.locator('.fr-editorial-head__nav a[href="/search/"]').count(), 0);
        const archiveLayout = await layout();
        const firstCard = page.locator(".fr-posts-card:visible").first();
        const cardColumns = await firstCard.evaluate(element => getComputedStyle(element).gridTemplateColumns);
        const cardMinutes = await firstCard.locator(".fr-posts-card__meta time, .fr-posts-card__meta span:not([aria-hidden])").allTextContents();
        const cardTopic = await firstCard.locator(".fr-posts-card__meta a").allTextContents();
        const cardUrl = await firstCard.locator("h3 a").getAttribute("href");
        await goto("/reading-list/");
        await waitList();
        const savedLayout = await layout();
        for (let i = 0; i < archiveLayout.length; i++) {
          assert.ok(Math.abs(archiveLayout[i].width - savedLayout[i].width) <= 1 && Math.abs(archiveLayout[i].x - savedLayout[i].x) <= 1,
            `${language} ${width}px ${JSON.stringify({ archive: archiveLayout[i], saved: savedLayout[i] })}`);
        }
        const matchingCard = page.locator(`.fr-saved-entry .fr-posts-card:has(h3 a[href="${cardUrl}"])`);
        assert.equal(await matchingCard.evaluate(element => getComputedStyle(element).gridTemplateColumns), cardColumns);
        assert.deepEqual(await matchingCard.locator(".fr-posts-card__meta time, .fr-posts-card__meta span:not([aria-hidden])").allTextContents(), cardMinutes, "Archive and reading list must share the same reading duration");
        assert.deepEqual(await matchingCard.locator(".fr-posts-card__meta a").allTextContents(), cardTopic);
        assert.equal(await page.locator(".fr-saved-entry").count(), 2, "Both article languages stay in the reader's list");
        assert.equal(await page.locator("[data-fr-clear-unavailable]").isVisible(), false);
        await noOverflow();
        if ([1440, 390, 320].includes(width)) {
          await page.screenshot({ path: path.join(output, `reading-list-${language}-${width}.png`), animations: "disabled" });
          await page.locator("[data-fr-library-tools]").scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(output, `reading-backup-${language}-${width}.png`), animations: "disabled" });
          await page.locator("#footer").scrollIntoViewIfNeeded();
          await page.waitForFunction(() => document.querySelector(".fr-reader-tools").getBoundingClientRect().bottom <= document.getElementById("footer").getBoundingClientRect().top - 10);
          await page.screenshot({ path: path.join(output, `footer-${language}-${width}.png`), animations: "disabled" });
        }
        await goto(article.url);
        await noOverflow();
        const [left, right] = await page.evaluate(() => [".fr-article-save", ".fr-article-language"].map(selector => {
          const box = document.querySelector(selector).getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        }));
        assert.ok(Math.abs(left.y + left.height / 2 - right.y - right.height / 2) <= 2,
          `Article actions and version must share one row: ${language} ${width}px ${JSON.stringify({ left, right })}`);
        assert.ok(left.x + left.width <= right.x + 1, "Article actions must precede the version switcher without overlap");
        const targets = await page.locator(".fr-article-action, .fr-article-toolbar .is-current").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
        assert.ok(targets.every(height => height >= 44), "Article toolbar controls need 44px touch targets");
        assert.equal(await save.locator("svg").count(), 1);
        if ([1440, 390, 320].includes(width)) await page.screenshot({ path: path.join(output, `article-tools-${language}-${width}.png`), animations: "disabled" });
      }
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await goto("/404.html");
    await page.locator("[data-fr-open-search]").click();
    assert.equal(await page.locator(".search__toggle").getAttribute("aria-expanded"), "true");
    assert.equal(await page.locator("#site-search").getAttribute("aria-hidden"), "false");
    await page.locator(".search__toggle").click();
    await noOverflow();
    await goto(article.url);
    await page.evaluate(() => {
      const content = document.querySelector(".page__content").getBoundingClientRect();
      scrollTo(0, scrollY + content.bottom - innerHeight + 10);
    });
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector(".fr-reading-progress i")).transform.split("(")[1].split(",")[0]) > .99);
    let commentAttempts = 0;
    await page.route("**/*.disqus.com/embed.js", route => ++commentAttempts === 1 ? route.abort() : route.fulfill({ contentType: "application/javascript", body: "window.__frCommentsLoaded = true;" }));
    await page.locator("[data-fr-disqus] button").click();
    await page.waitForFunction(() => document.querySelector("[data-fr-disqus]").dataset.frCommentState === "failed");
    await page.locator("[data-fr-disqus] button").click();
    await page.waitForFunction(() => window.__frCommentsLoaded === true);
    assert.equal(commentAttempts, 2);
    await goto(article.url + "?source=verification#test", { referer: base + article.url + "?source=private" });
    await page.waitForFunction(() => window.__frAnalyticsLoaded === true);
    assert.equal(commentAttempts, 2, "Comments require a new choice on every page");
    const config = await page.evaluate(() => Array.from(window.dataLayer.find(event => event[0] === "config"))[2]);
    assert.equal(config.page_location, base + article.url);
    assert.equal(config.page_referrer, base + article.url);
    assert.equal(await page.locator("#privacy-settings").count(), 0);
    assert.deepEqual(errors, []);
  } catch (error) {
    console.error({ url: page.url(), status: await page.locator("[data-fr-library-status]").allTextContents(), errors });
    await page.screenshot({ path: path.join(output, "reading-feature-failure.png"), fullPage: true });
    throw error;
  } finally { await context.close(); }

  for (const signal of ["globalPrivacyControl", "doNotTrack", "storageBlocked", "storageReadOnly"]) {
    const visitor = await browser.newContext({ timezoneId: "Asia/Taipei" });
    const requests = [];
    await visitor.route("**/*", route => {
      const url = route.request().url();
      if (new URL(url).origin === base) return route.continue();
      if (/googletagmanager\.com\/gtag/.test(url)) return route.fulfill({ contentType: "application/javascript", body: "" });
      return route.abort();
    });
    visitor.on("request", request => { if (/googletagmanager\.com\/gtag|\.disqus\.com\/embed/.test(request.url())) requests.push(request.url()); });
    await visitor.addInitScript(signal => {
      if (signal === "storageBlocked") Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } });
      else if (signal === "storageReadOnly") Storage.prototype.setItem = () => { throw new Error("Storage full"); };
      else Object.defineProperty(navigator, signal, { get() { return signal === "globalPrivacyControl" ? true : "1"; } });
    }, signal);
    try {
      const blocked = await visitor.newPage();
      const errors = [];
      blocked.on("pageerror", error => errors.push(error.message));
      await blocked.goto(base + article.url);
      const button = blocked.locator("[data-fr-save-article]");
      await button.waitFor({ state: "visible" });
      if (signal === "storageBlocked") {
        assert.equal(await button.isDisabled(), true);
        await blocked.goto(base + "/reading-list/");
        await blocked.waitForFunction(() => document.querySelector("[data-fr-reading-list]")?.dataset.frReady === "true");
        assert.match(await blocked.locator("[data-fr-library-status]").textContent(), /存储|storage/i);
        assert.equal(await blocked.locator("[data-fr-reading-import]").isDisabled(), true);
      } else if (signal === "storageReadOnly") {
        await button.click();
        assert.equal(await button.getAttribute("aria-pressed"), "false");
        assert.match(await blocked.locator("[data-fr-save-status]").textContent(), /存储|storage/i);
        await blocked.goto(base + "/reading-list/");
        await blocked.waitForFunction(() => document.querySelector("[data-fr-reading-list]")?.dataset.frReady === "true");
        const original = await blocked.evaluate(key => localStorage.getItem(key), savedKey);
        await blocked.locator("[data-fr-reading-file]").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "facereader.readingList", version: 1, urls: [article.url] })) });
        await blocked.waitForFunction(() => document.querySelector("[data-fr-reading-list]").getAttribute("aria-busy") === "false");
        assert.match(await blocked.locator("[data-fr-transfer-status]").textContent(), /存储|storage/i);
        assert.equal(await blocked.evaluate(key => localStorage.getItem(key), savedKey), original);
      } else assert.deepEqual(requests, [], signal);
      assert.deepEqual(errors, []);
    } finally { await visitor.close(); }
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  await noJs.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  try {
    const fallback = await noJs.newPage();
    await fallback.goto(base + "/reading-list/");
    assert.equal(await fallback.locator('noscript a[href="/posts/"]').isVisible(), true);
  } finally { await noJs.close(); }
  console.log("Reading-list archive geometry, footer, article toolbar, saved data, storage failures, configured services and 320–1440px bilingual layouts passed.");
}
