import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { VaultFile } from "../build";

const vaultDir = fileURLToPath(new URL("./fixtures/vault/", import.meta.url));

/** Reads the on-disk fixture vault into the shape `buildSwitchboard` expects. */
export function loadFixtureVault(): VaultFile[] {
  return readdirSync(vaultDir, { recursive: true })
    .map((p) => String(p).replaceAll("\\", "/"))
    .filter((p) => p.endsWith(".md"))
    .sort()
    .map((relpath) => ({ relpath, text: readFileSync(vaultDir + relpath, "utf8") }));
}
