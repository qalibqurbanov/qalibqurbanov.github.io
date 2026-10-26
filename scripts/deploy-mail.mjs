// Deploys the mail Cloudflare Worker and keeps its settings.
//
// A plain deploy removes the variables that were entered in the Cloudflare dashboard (the Resend key, the
// Turnstile secret, the address that receives the mail). So before deploying, this reads the variables of the
// version that is live now and hands them to the deploy again. Their values are never printed.
//
// Any extra argument goes to `wrangler deploy` (for example --dry-run, which builds without uploading).
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const worker = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "worker");

function run(args, options = {}) {
  return spawnSync("npx", ["wrangler", ...args], { cwd: worker, shell: true, encoding: "utf8", ...options });
}

function readJson(args) {
  const result = run([...args, "--json"]);
  const output = result.stdout ?? "";
  const start = output.indexOf("{");
  if (result.status !== 0 || start < 0) throw new Error(`wrangler ${args.join(" ")} failed:\n${result.stderr ?? ""}${output}`);
  return JSON.parse(output.slice(start));
}

/** Values never reach the screen: "env.NAME ("value")" and "--var NAME:value" lose the value. */
const hide = (text) =>
  text
    .replace(/(env\.\w+) \("[^"]*"\)/g, "$1 (value hidden)")
    .replace(/--var "?(\w+):[^\s"]+"?/g, "--var $1:(value hidden)");

try {
  console.log("Reading the settings of the live version...");
  const deployment = readJson(["deployments", "status"]);
  const live = [...deployment.versions].sort((a, b) => b.percentage - a.percentage)[0];
  const version = readJson(["versions", "view", live.version_id]);
  const variables = version.resources.bindings.filter((binding) => binding.type === "plain_text");
  console.log(variables.length > 0 ? `Keeping: ${variables.map((v) => v.name).join(", ")}` : "The live version has no variables to keep.");

  const args = ["deploy", "--keep-vars", ...variables.flatMap((v) => ["--var", `"${v.name}:${v.text}"`]), ...process.argv.slice(2)];
  console.log("Deploying...");
  const result = run(args);
  process.stdout.write(hide(result.stdout ?? ""));
  process.stderr.write(hide(result.stderr ?? ""));
  process.exit(result.status ?? 1);
} catch (error) {
  console.error(hide(String(error.message ?? error)));
  process.exit(1);
}
