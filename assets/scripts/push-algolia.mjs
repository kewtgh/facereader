import fs from "node:fs/promises";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";
import { prepareRecords } from "./algolia-records.mjs";

const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME, JEKYLL_CONFIG } = process.env;
async function main() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) throw new Error("Missing Algolia synchronization credentials");
  const inputPath = process.argv[2] || "tmp/build/algolia-records.json";
  const [input, source] = await Promise.all([fs.readFile(inputPath, "utf8"), fs.readFile(JEKYLL_CONFIG || "_config.yml", "utf8")]);
  const records = prepareRecords(JSON.parse(input), YAML.parse(source));
  console.log(`Validated ${records.length} search records from the private build artifact.`);
  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
  await client.replaceAllObjects({ indexName: ALGOLIA_INDEX_NAME, objects: records });
  console.log("Algolia synchronization completed.");
}
main().catch(error => { console.error(`Algolia synchronization stopped: ${error.message}`); process.exitCode = 1; });
