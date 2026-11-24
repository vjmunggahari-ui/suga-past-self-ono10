import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) {
  throw new Error("MAKEFUN_OUTPUT_DIR is not set");
}

// Expected sha256 of the entry (verified from the first run).
const EXPECTED_SHA256 =
  "01900b41d7271d0494bcbda12cfb716895e6372fa61f3b4ef0676516ccfddae0";

const ENTRY =
  "Don't delete the voicemail from your father on the night he called twice.\n" +
  "It's the last time you ever heard his voice, and you can't get it back.";

// Self-check before writing: gate 1-280 chars, exactly 2 lines, one sentence each.
const lines = ENTRY.split("\n");
if (ENTRY.length < 1 || ENTRY.length > 280) {
  throw new Error(`entry length ${ENTRY.length} outside 1-280`);
}
if (lines.length !== 2) {
  throw new Error(`entry has ${lines.length} lines, expected 2`);
}
for (const line of lines) {
  const dots = (line.match(/\./g) ?? []).length;
  if (dots !== 1 || !line.endsWith(".")) {
    throw new Error(`line is not exactly one sentence: ${line}`);
  }
}

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, ENTRY, "utf8");

// Read-back self-check: byte-identical, no trailing newline, sha256 match,
// and the written file re-verified as exactly 2 lines of 1 sentence each.
const back = readFileSync(outPath, "utf8");
if (back !== ENTRY) throw new Error("read-back mismatch");
if (back.endsWith("\n")) throw new Error("trailing newline present");
const backLines = back.split("\n");
if (backLines.length !== 2) {
  throw new Error(`written file has ${backLines.length} lines, expected 2`);
}
for (const line of backLines) {
  const dots = (line.match(/\./g) ?? []).length;
  if (dots !== 1 || !line.endsWith(".")) {
    throw new Error(`written line is not exactly one sentence: ${line}`);
  }
}
const sha = createHash("sha256").update(back, "utf8").digest("hex");
if (sha !== EXPECTED_SHA256) {
  throw new Error(`sha256 mismatch: got ${sha}`);
}
console.log(`wrote ${outPath} (${ENTRY.length} chars, 2 sentences, sha256 ${sha})`);
