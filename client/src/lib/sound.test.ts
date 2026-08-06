import { describe, expect, it, beforeEach, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sounds } from "cuelume";
import { getSoundEnabled } from "./sound.js";

const SOUND_KEY = "lumina:sound";

beforeEach(() => {
  // jsdom provides localStorage; reset between tests for deterministic pref reads.
  window.localStorage.clear();
});

describe("getSoundEnabled", () => {
  it("returns false when SOUND_KEY is unset (default OFF / local-first)", () => {
    expect(window.localStorage.getItem(SOUND_KEY)).toBeNull();
    expect(getSoundEnabled()).toBe(false);
  });

  it("returns true when SOUND_KEY is set to '1'", () => {
    window.localStorage.setItem(SOUND_KEY, "1");
    expect(getSoundEnabled()).toBe(true);
  });

  it("returns false when SOUND_KEY is set to anything other than '1'", () => {
    window.localStorage.setItem(SOUND_KEY, "0");
    expect(getSoundEnabled()).toBe(false);
  });
});

/**
 * play() silently no-ops on unknown names, so a typo in a cue name would
 * ship as silence. Scan every source file for playCue("…") calls and
 * data-cuelume-* attribute values and assert each names a real cue.
 */

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [full]
      : [];
  });
}

function cueNamesInUse(): Map<string, string[]> {
  const uses = new Map<string, string[]>();
  const record = (name: string, file: string) => {
    const files = uses.get(name) ?? [];
    files.push(file);
    uses.set(name, files);
  };
  for (const file of walk(SRC_DIR)) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/playCue\("([^"]+)"\)/g)) {
      record(m[1], file);
    }
    for (const m of text.matchAll(
      /data-cuelume-(?:hover|press|release|toggle)="([^"]+)"/g,
    )) {
      record(m[1], file);
    }
  }
  return uses;
}

describe("sound cue sanity", () => {
  it("finds cue usages to check (the scan itself works)", () => {
    expect(cueNamesInUse().size).toBeGreaterThan(0);
  });

  it("every cue name used in the app exists in cuelume's sounds export", () => {
    const valid = new Set<string>(sounds);
    for (const [name, files] of cueNamesInUse()) {
      expect(valid.has(name), `unknown cue "${name}" used in ${files.join(", ")}`).toBe(
        true,
      );
    }
  });
});
