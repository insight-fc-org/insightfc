import fs from 'node:fs/promises';
import { execSync } from 'node:child_process';

const prompt = process.argv.slice(2).join(' ').trim() || 'Scaffold task';

const slug = prompt
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 40) || 'task';

const name = slug.replace(/-/g, '_'); // function name
const file = `packages/api/src/${slug}.ts`;
const test = `packages/api/src/${slug}.test.ts`;

const code = `export function ${name}(x: number) { return x; }\n`;
const spec = `import { describe, it, expect } from 'vitest';
import { ${name} } from './${slug}';
describe('${slug}', () => {
  it('returns input', () => {
    expect(${name}(42)).toBe(42);
  });
});
`;

await fs.mkdir('packages/api/src', { recursive: true });
await fs.writeFile(file, code);
await fs.writeFile(test, spec);

execSync(`git add ${file} ${test}`, { stdio: 'inherit' });
console.log(`[ai-pr-bot] prepared ${file} and ${test} for: ${prompt}`);