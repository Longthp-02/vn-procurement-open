// @vitest-environment node
/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Repo rule (AGENTS.md): Vietnamese appears in code only in web/src/i18n/vi.ts (and test fixtures).
const SRC = join(process.cwd(), 'src'); // vitest runs from web/
// Any accented Latin letter (Latin-1 Supplement, Latin Extended-A/B, Latin Extended Additional).
const VIETNAMESE = /[\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F\u1E00-\u1EFF]/;
const ALLOWED = [/^i18n\/vi\.ts$/, /\.test\.tsx?$/, /^test\//];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('UI copy location', () => {
  it('keeps Vietnamese text inside src/i18n/vi.ts', () => {
    const offenders = files(SRC)
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .map((f) => relative(SRC, f))
      .filter((rel) => !ALLOWED.some((re) => re.test(rel)))
      .flatMap((rel) =>
        readFileSync(join(SRC, rel), 'utf8')
          .split('\n')
          .map((line, i) => ({ rel, line: i + 1, text: line.trim() }))
          .filter(({ text }) => VIETNAMESE.test(text)),
      );
    expect(offenders.map((o) => `${o.rel}:${o.line} ${o.text}`)).toEqual([]);
  });
});
