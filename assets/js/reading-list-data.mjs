export const readingListKey = "facereader.readingList.v1";
export const readingListLimit = 100;

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
