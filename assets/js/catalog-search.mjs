// Small, shared browser/Node contract for local discovery and saved URLs.
export const readingListKey = "facereader.readingList.v1";
export const readingListLimit = 100;

export function normalize(value) {
  return String(value || "").normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ").trim();
}

export function validPath(value) {
  return typeof value === "string" && /^\/(?!\/)/.test(value) &&
    !/[\\\s\u0000-\u001f?#]/.test(value) && !/%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(value);
}

export function readSaved(raw) {
  try {
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? [...new Set(value.filter(validPath))].slice(0, readingListLimit) : [];
  } catch { return []; }
}

export function validateCatalog(value) {
  if (value?.version !== 1 || !Array.isArray(value.posts)) throw new TypeError("Invalid article catalog");
  const seen = new Set();
  for (const post of value.posts) {
    if (!validPath(post?.url) || seen.has(post.url) || !["zh", "en"].includes(post.language) ||
      typeof post.title !== "string" || !post.title.trim() || typeof post.excerpt !== "string" ||
      !Number.isInteger(post.minutes) || post.minutes < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(post.date) ||
      !Number.isFinite(Date.parse(`${post.date}T00:00:00Z`)) || new Date(`${post.date}T00:00:00Z`).toISOString().slice(0, 10) !== post.date ||
      ![post.tags, post.categories].every(list => Array.isArray(list) && list.every(item => typeof item === "string"))) {
      throw new TypeError("Invalid article catalog record");
    }
    seen.add(post.url);
  }
  return value.posts;
}

export function findArticles(posts, { query = "", category = "", language = "zh" } = {}) {
  const tokens = normalize(query).slice(0, 200).split(" ").filter(Boolean);
  return posts.filter(post => post.language === language && (!category || post.categories.includes(category)))
    .map(post => {
      const title = normalize(post.title);
      const taxonomy = normalize([...post.tags, ...post.categories].join(" "));
      const excerpt = normalize(post.excerpt);
      const scores = tokens.map(token => title.includes(token) ? 6 : taxonomy.includes(token) ? 3 : excerpt.includes(token) ? 1 : 0);
      return { post, score: scores.every(Boolean) ? scores.reduce((sum, value) => sum + value, 0) : -1 };
    }).filter(match => match.score >= 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date) || a.post.url.localeCompare(b.post.url))
    .map(match => match.post);
}
