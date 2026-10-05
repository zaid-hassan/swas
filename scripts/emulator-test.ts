/**
 * Runs an emulator-backed test file with `.env.local` / `.env` loaded.
 *
 * The emulator test files need the Firebase env plus
 * `FIRESTORE_EMULATOR_HOST`; Next.js loads the env files for the app but tsx
 * does not, so this wrapper keeps the run reproducible:
 *
 *   pnpm test:emulator              # tests/manual-create.emulator.ts
 *   pnpm test:emulator:integration  # tests/integration.emulator.ts
 *
 * The Firestore emulator must already be listening on port 8085 (see the
 * header of each test file). Standalone start (no firebase CLI needed):
 *
 *   java -jar ~/.cache/firebase/emulators/cloud-firestore-emulator-v1.19.8.jar \
 *     --host=127.0.0.1 --port=8085
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_EMULATOR_HOST = "127.0.0.1:8085";

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;

  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Service-account keys are stored on one line with literal \n escapes
    // (same convention lib/firebase-admin.ts decodes at runtime).
    value = value.replace(/\\n/g, "\n");

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    throw new Error("usage: tsx scripts/emulator-test.ts <test-file>");
  }

  loadEnvFile(resolve(".env.local"));
  loadEnvFile(resolve(".env"));

  process.env.FIRESTORE_EMULATOR_HOST ||= DEFAULT_EMULATOR_HOST;
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||= "admin@x.com";

  console.log(`Emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);

  await import(pathToFileURL(resolve(target)).href);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
