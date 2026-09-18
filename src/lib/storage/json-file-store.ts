import { promises as fs } from "node:fs";
import path from "node:path";
import type { ZodType } from "zod";

// Per-file-path in-process write queue. Serializes every read-modify-write
// against a given file to program order, so two concurrent requests can
// never clobber each other's update. This only protects a single Node
// process — it is not a substitute for a real datastore if this app is
// ever horizontally scaled or run serverless (see /context.md).
const writeQueues = new Map<string, Promise<unknown>>();

function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const prior = writeQueues.get(key) ?? Promise.resolve();
  const run = prior.then(
    () => task(),
    () => task()
  );
  writeQueues.set(
    key,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function atomicWriteFile(filePath: string, data: string): Promise<void> {
  await ensureDir(filePath);
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmpPath, data, "utf8");
  await fs.rename(tmpPath, filePath); // atomic on the same filesystem
}

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if (isErrnoException(err) && err.code === "ENOENT") return fallback;
    throw err;
  }
}

/**
 * Reads and validates a JSON file against a zod schema. A missing file
 * returns `fallback` silently (normal on first run). A corrupted or
 * schema-invalid file logs loudly and also returns `fallback` rather than
 * crashing the server — the bad file is left on disk, untouched, for
 * inspection, since reading never writes.
 */
export async function readValidatedJsonFile<T>(
  filePath: string,
  schema: ZodType<T>,
  fallback: T,
  label: string
): Promise<T> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err: unknown) {
    if (isErrnoException(err) && err.code === "ENOENT") return fallback;
    throw err;
  }
  try {
    return schema.parse(JSON.parse(raw));
  } catch (err) {
    console.error(
      `[storage] ${label} is corrupted or invalid (${(err as Error).message}). ` +
        `Falling back to defaults for this read. The file was left as-is at ${filePath}.`
    );
    return fallback;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await enqueue(filePath, () => atomicWriteFile(filePath, JSON.stringify(data, null, 2) + "\n"));
}

/**
 * Atomic read-modify-write of a JSON file, serialized per file path so
 * concurrent callers never lose an update. `mutator` receives a deep clone
 * of the current value (or `fallback` if the file doesn't exist yet).
 *
 * The read side goes through the same schema-validated,
 * corrupted-file-falls-back-to-defaults path as readValidatedJsonFile --
 * this is deliberate, not incidental: a plain unvalidated read here would
 * let a corrupted file crash the WRITE path (an uncaught JSON.parse
 * SyntaxError) even though the read-only path degrades gracefully, which
 * is exactly the inconsistency a corrupted-file test caught during Phase 6
 * verification. See /context.md.
 */
export async function updateJsonFile<T>(
  filePath: string,
  schema: ZodType<T>,
  fallback: T,
  mutator: (current: T) => T | Promise<T>,
  label: string
): Promise<T> {
  return enqueue(filePath, async () => {
    const current = await readValidatedJsonFile(filePath, schema, fallback, label);
    const updated = await mutator(structuredClone(current));
    await atomicWriteFile(filePath, JSON.stringify(updated, null, 2) + "\n");
    return updated;
  });
}

export async function appendJsonLine(filePath: string, line: unknown): Promise<void> {
  await enqueue(filePath, async () => {
    await ensureDir(filePath);
    await fs.appendFile(filePath, JSON.stringify(line) + "\n", "utf8");
  });
}

/** Skips (and logs) any line that isn't valid JSON, rather than letting one bad line fail the whole read. */
export async function readJsonLines<T>(filePath: string): Promise<T[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err: unknown) {
    if (isErrnoException(err) && err.code === "ENOENT") return [];
    throw err;
  }
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const results: T[] = [];
  for (const line of lines) {
    try {
      results.push(JSON.parse(line) as T);
    } catch {
      console.error(`[storage] Skipping unparseable line in ${filePath}: ${line.slice(0, 100)}`);
    }
  }
  return results;
}
