import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

export async function testPublicationFeatures({ browser, base, root, output }) {
  const catalog = JSON.parse(await fs.readFile(path.join(root, "category-index.json"), "utf8"));
  const [key, category] = Object.entries(catalog).find(([, item]) => item.posts.some(post => post.language === "zh"));
  const expected = language => category.posts.filter(post => post.language === language);
  const languages = new Map(Object.values(catalog).flatMap(item => item.posts).map(post => [post.url, post.language]));
  const context = await browser.newContext({ timezoneId: "Asia/Taipei", reducedMotion: "reduce" });
  const indexVersions = [];
  const siteVersion = JSON.parse(await fs.readFile("package.json", "utf8")).version;
  context.on("request", request => { const url = new URL(request.url()); if (url.pathname.endsWith("/category-index.json")) indexVersions.push(url.searchParams.get("v")); });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/category-index.json") && !url.search) return route.fulfill({ contentType: "application/json", body: "{}" });
    return url.origin === base ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const ready = () => page.waitForFunction(() => document.querySelector("#category-detail").getAttribute("aria-busy") === "false");
  try {
    await page.goto(base + "/categories/#" + encodeURIComponent(key));
    await ready();
    for (const language of ["zh", "en", "zh"]) {
      await page.locator(`[data-fr-ui-lang-option="${language}"]`).click();
      await ready();
      const cards = page.locator("#category-detail-posts li");
      assert.equal(await cards.count(), expected(language).length);
      assert.ok(await cards.evaluateAll((items, language) => items.every(item => item.lang === language), language));
      if (!expected(language).length) assert.match(await page.locator("#category-detail-status").textContent(), /No English|暂无中文/);
      const visible = page.locator(".fr-category-directory li:visible");
      assert.equal(await visible.count(), Object.values(catalog).filter(item => item.posts.some(post => post.language === language)).length);
      for (const entry of await visible.evaluateAll(items => items.map(item => ({ key: decodeURIComponent(item.querySelector("a").hash.slice(1)), count: Number(item.querySelector("span").textContent) })))) {
        assert.equal(entry.count, catalog[entry.key].posts.filter(post => post.language === language).length);
      }
      const urls = await page.locator(`.fr-pillars [data-fr-i18n-block="${language}"] a.fr-pillar__preview, .fr-pillars [data-fr-i18n-block="${language}"] a.fr-pillar__more-item`).evaluateAll(links => links.map(link => link.getAttribute("href")));
      assert.ok(urls.every(url => languages.get(url) === language), "Category previews must use the selected article language");
      assert.ok(await page.locator(".fr-pillar:visible").evaluateAll((pillars, language) => pillars.every(pillar => Number(pillar.getAttribute("data-fr-pillar-count-" + language)) > 0), language), "Empty topics must not precede readable content");
    }
    const response = await page.request.get(base + "/category-index.json?v=browser");
    assert.equal(response.status(), 200, "Robots exclusions must not block browser functionality");
    assert.equal((await page.request.get(base + "/algolia-records.json")).status(), 404);
    assert.equal((await page.request.get(base + "/redirects.json")).status(), 404);
    const malformed = structuredClone(catalog);
    malformed[key].posts[0].url = "javascript:alert(1)";
    await page.route("**/category-index.json*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify(malformed) }));
    await page.reload();
    await page.locator("#category-detail-retry:not([hidden])").waitFor();
    assert.equal(await page.locator("#category-detail-posts a").count(), 0);
    await page.unroute("**/category-index.json*");
    await page.locator("#category-detail-retry").click();
    await ready();
    assert.equal(await page.locator("#category-detail-retry").isVisible(), false);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const language of ["zh", "en"]) {
        await page.locator(`[data-fr-ui-lang-option="${language}"]`).click();
        await ready();
        await page.evaluate(() => document.fonts.ready);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.screenshot({ path: path.join(output, `category-language-${language}-${width}.png`), animations: "disabled" });
      }
    }
    assert.ok(indexVersions.length && indexVersions.every(version => version === siteVersion), "Category data must bypass an old unversioned schema cache");
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
  console.log("JSON publication boundaries, category language/count/preview synchronization, malformed-data rejection and retry passed.");
}
