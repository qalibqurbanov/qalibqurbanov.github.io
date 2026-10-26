// WHAT THIS FILE DOES (in simple words)
//
// You never need to open or run this file yourself. The file
// "upload-mail-sender-to-cloudflare.bat" starts it for you.
//
// The mail-sending program (worker\index.js) lives on Cloudflare. To upload a new version of it, the
// normal upload command has one bad habit: it erases your 3 keys that are saved on Cloudflare (the Resend
// key, the spam-check key and the email address that receives the mail). Without them, no mail is sent.
//
// So this file does 3 things, in this order:
//   1. Looks at the version that is running on Cloudflare right now and reads your 3 keys from it.
//   2. Uploads the new version and gives the 3 keys back to it, so nothing is lost.
//   3. Hides the keys on the screen, so they are never shown.
//
// For developers: any extra argument goes to `wrangler deploy` (for example --dry-run, which builds
// without uploading anything).
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
