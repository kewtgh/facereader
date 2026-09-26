export const normalizeCompanyName = (value) => String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, "");

export function resolveCompany(companies, query, rank) {
  const needle = normalizeCompanyName(query);
  if (!needle) return { company: null, candidates: [], reason: "empty" };
  const canonical = companies.filter((item) => normalizeCompanyName(item.name) === needle);
  if (canonical.length === 1) return { company: canonical[0], candidates: [], reason: "name" };
  if (canonical.length > 1) return { company: null, candidates: canonical, reason: "ambiguous" };
  const aliases = companies.filter((item) => (item.aliases || []).some((alias) => normalizeCompanyName(alias) === needle));
  if (aliases.length === 1) return { company: aliases[0], candidates: [], reason: "alias" };
  if (aliases.length > 1) return { company: null, candidates: aliases, reason: "ambiguous" };
  const matches = rank(query);
  const first = matches[0];
  const second = matches[1];
  if (first && first.score >= 80 && (!second || first.score - second.score >= 8)) {
    return { company: first.company, candidates: [], reason: "fuzzy" };
  }
  return { company: null, candidates: matches.slice(0, 6).map((item) => item.company), reason: "unresolved" };
}
