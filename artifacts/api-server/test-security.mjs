import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const directory = await mkdtemp(path.join(tmpdir(), "nexus-security-"));
try {
  const outfile = path.join(directory, "ingestion.test.cjs");
  await build({
    entryPoints: [new URL("./tests/ingestion-security.test.ts", import.meta.url).pathname],
    outfile,
    platform: "node",
    format: "cjs",
    bundle: true,
  });
  const result = spawnSync(process.execPath, ["--test", outfile], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
