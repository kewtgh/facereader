import { spawn } from "node:child_process";

const env = {
  ...process.env,
  JEKYLL_ENV: process.env.JEKYLL_ENV || "production",
  // This subprocess validates Sass output, not live search. Keep production's
  // missing-secret guard intact while giving this isolated build a non-secret
  // placeholder when no deployment key is available.
  ALGOLIA_SEARCH_API_KEY: process.env.ALGOLIA_SEARCH_API_KEY || "site-check-placeholder",
};

const command = process.env.RUBY || "ruby";
const args = ["-S", "bundle", "exec", "ruby", "-EUTF-8", "-S", "jekyll", "build"];

let child;

try {
  child = spawn(command, args, {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  console.error(`Unable to start Sass warning check command: ${command} ${args.join(" ")}`);
  console.error(error.message);
  process.exit(1);
}

let output = "";

for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    output += text;
    process.stdout.write(text);
  });
}

const exitCode = await new Promise((resolve) => {
  child.on("error", (error) => {
    console.error(`Unable to start Sass warning check command: ${command} ${args.join(" ")}`);
    console.error(error.message);
    resolve(1);
  });
  child.on("close", resolve);
});

if (exitCode !== 0) {
  process.exit(exitCode);
}

const warningPattern =
  /DEPRECATION WARNING \[([^\]]+)\]:[\s\S]*?(?=\nDEPRECATION WARNING \[|\nWARNING: \d+ repetitive deprecation warnings omitted\.|\n\s*done in |$)/g;

const warnings = [...output.matchAll(warningPattern)].map((match) => {
  const block = match[0];
  const category = match[1];
  const sources = [...block.matchAll(/^\s+(.+?)\s+\d+:\d+\s+(@use|@forward|root stylesheet|[A-Za-z_-]+\(\))/gm)]
    .map((sourceMatch) => sourceMatch[1].trim())
    .filter(Boolean);

  return {
    category,
    sources,
  };
});

if (warnings.length > 0) {
  const summary = warnings
    .map((warning) => {
      const source = warning.sources[0] || "unknown source";
      return `- ${warning.category}: ${source}`;
    })
    .join("\n");

  console.error(`Sass deprecation warnings are not allowed:\n${summary}`);
  process.exit(1);
}

console.log("Sass deprecation warning check passed.");
