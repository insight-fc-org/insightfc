import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';

const prompt = process.argv.slice(2).join(' ').trim() || 'Scaffold task';
const safe =
  prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'task';

const file = `packages/api/src/${safe}.ts`;
const test = `packages/api/src/${safe}.test.ts`;

// Minimal “AI” stub: generate a function + a test. (Later we'll replace this with a call to your LLM proxy.)
const code = `export function ${safe.replace(/-/g, '_')}(x: number) { return x; }\n`;
const spec = `import { describe, it, expect } from 'vitest';
import { ${safe.replace(/-/g, '_')} } from './${safe}';
describe('${safe}', () => { it('returns input', () => { expect(${safe.replace(/-/g, '_')}(42)).toBe(42); }); });
`;

await fs.mkdir('packages/api/src', { recursive: true });
await fs.writeFile(file, code);
await fs.writeFile(test, spec);

// stage changes
execSync(`git add ${file} ${test}`, { stdio: 'inherit' });
console.log(`[ai-pr-bot] prepared ${file} and ${test} for: ${prompt}`);
