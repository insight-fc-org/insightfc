import http from 'node:http';

const PORT = process.env.PORT || 8787;

// Very simple shim: accepts {prompt, context} and returns two files under packages/api/src
const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/generate') {
    res.writeHead(404).end('not found'); return;
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      const { prompt = '', context = {} } = JSON.parse(body || '{}');
      const slug = (prompt || 'ai-file')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'ai-file';
      const name = slug.replace(/-/g, '_');
      const dto = `export function ${name}(x:number){return x}\n`;
      const test = `import { describe,it,expect } from 'vitest'; import { ${name} } from './${slug}'; describe('${slug}',()=>{it('ok',()=>{expect(${name}(1)).toBe(1)})})\n`;
      const files = [
        { path: `packages/api/src/${slug}.ts`, content: dto },
        { path: `packages/api/src/${slug}.test.ts`, content: test },
      ];
      res.writeHead(200, {'content-type':'application/json'});
      res.end(JSON.stringify({ files, meta: { receivedPrompt: prompt, items: (context?.mcp?.items||[]).length } }));
    } catch (e) {
      res.writeHead(400).end(String(e?.message || e));
    }
  });
});

server.listen(PORT, () => console.error(`[mock-gen] listening on :${PORT}`));