import fs from "node:fs/promises";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";

const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME, ALGOLIA_SEARCH_API_KEY, JEKYLL_CONFIG } = process.env;

function requirePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

async function main() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
    throw new Error("Missing ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, or ALGOLIA_INDEX_NAME");
  }

  const configPath = JEKYLL_CONFIG || "_config.yml";
  const config = YAML.parse(await fs.readFile(configPath, "utf8")) || {};
  const algoliaConfig = config.algolia || {};
  const searchApiKey = ALGOLIA_SEARCH_API_KEY;
  if (!searchApiKey) throw new Error("Missing ALGOLIA_SEARCH_API_KEY");

  const apiKey = {
    acl: ["search"],
    description: "FaceReader restricted browser search key",
    indexes: [ALGOLIA_INDEX_NAME],
    maxHitsPerQuery: requirePositiveInteger(algoliaConfig.max_hits_per_query || 50, "max_hits_per_query"),
    maxQueriesPerIPPerHour: requirePositiveInteger(
      algoliaConfig.max_queries_per_ip_per_hour || 60,
      "max_queries_per_ip_per_hour"
    ),
    referers: Array.isArray(algoliaConfig.allowed_referrers) ? algoliaConfig.allowed_referrers : []
  };
  if (!apiKey.referers.length) throw new Error("algolia.allowed_referrers must contain at least one origin");

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
  await client.updateApiKey({ key: searchApiKey, apiKey });
  await client.waitForApiKey({ key: searchApiKey, operation: "update", apiKey });

  console.log(
    `Algolia search key protected: index=${ALGOLIA_INDEX_NAME}, ` +
    `maxHits=${apiKey.maxHitsPerQuery}, maxQueries/IP/hour=${apiKey.maxQueriesPerIPPerHour}`
  );
}

main().catch((error) => {
  console.error(`Algolia search key protection failed: ${error.message}`);
  process.exit(1);
});
