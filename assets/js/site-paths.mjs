export function validPath(value) {
  return typeof value === "string" && /^\/(?!\/)/.test(value) &&
    !/[\\\s\u0000-\u001f?#]/.test(value) && !/%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(value);
}
