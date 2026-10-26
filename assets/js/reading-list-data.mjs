const { validPath } = await import("./site-paths.mjs" + new URL(import.meta.url).search);
export { validPath };
export const readingListKey = "facereader.readingList.v1";
export const readingListLimit = 100;
export const readingListBackupBytes = 100 * 1024;

export function readSaved(raw) {
  try {
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? [...new Set(value.filter(validPath))].slice(0, readingListLimit) : [];
  } catch { return []; }
}
export function serializeReadingBackup(urls) {
  return JSON.stringify({ format: "facereader.readingList", version: 1, urls: readSaved(JSON.stringify(urls)) }, null, 2);
}
export function mergeReadingBackup(raw, existing, available) {
  if (typeof raw !== "string") throw new Error("invalid");
  if (new TextEncoder().encode(raw).byteLength > readingListBackupBytes) throw new Error("size");
  let backup;
  try { backup = JSON.parse(raw); } catch { throw new Error("invalid"); }
  if (!backup || backup.format !== "facereader.readingList" || backup.version !== 1 || !Array.isArray(backup.urls) || !backup.urls.every(validPath)) throw new Error("invalid");
  if (backup.urls.length > readingListLimit) throw new Error("limit");
  const incoming = [...new Set(backup.urls)];
  const known = incoming.filter(url => available.has(url));
  const urls = [...new Set([...existing, ...known])];
  if (urls.length > readingListLimit) throw new Error("limit");
  return { urls, added: urls.length - existing.length, skipped: incoming.length - known.length };
}
