// Runs this repo's Railway CLI (@railway/cli devDependency) with `_` set to its
// binary, for this process only.
//
// Why: railway/iac checks the CLI version with execFileSync(process.env._ ||
// "railway"). Shells on macOS/Linux set `_`; PowerShell/cmd don't, and Windows
// can't execFileSync the npm `railway.cmd` shim, so `railway config plan`
// fails with a misleading "requires Railway CLI 5.42.1 or newer".
//
//   npm run railway -- config plan
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const binDir = join(dirname(require.resolve("@railway/cli/package.json")), "bin");
const binPath = join(binDir, process.platform === "win32" ? "railway.exe" : "railway");

const result = spawnSync(binPath, process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env, _: binPath },
});

if (result.error) {
  console.error(`railway: could not run ${binPath}: ${result.error.message}`);
  process.exit(127);
}
process.exit(result.status ?? 1);
