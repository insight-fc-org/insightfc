import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build path to dist server
const serverPath = path.join(__dirname, '..', 'dist', 'index.js');

// Start the server
const proc = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });
proc.stdout.setEncoding('utf8');

// Helper to exchange one JSON-RPC request
function send(method, params) {
  const id = Math.random().toString(36).slice(2);
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
  proc.stdin.write(msg);
  return new Promise((resolve, reject) => {
    const onData = (buf) => {
      // Split buffer into lines, parse only lines that look like JSON
      const lines = String(buf).split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed[0] === '{' || trimmed[0] === '[') {
          try {
            const resp = JSON.parse(trimmed);
            if (resp.id === id || resp.result || resp.error) {
              proc.stdout.off('data', onData);
              resolve(resp);
              return;
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    };
    proc.stdout.on('data', onData);
  });
}

// 1) list tools
const list = await send('tools/list', {});
assert.ok(list.result?.tools?.length > 0, 'no tools listed');

// 2) call fixtures_get
const call = await send('tools/call', { name: 'fixtures_get', arguments: { leagueId: 39, limit: 1 }});
assert.ok(call.result?.content?.[0]?.json?.items?.length === 1, 'unexpected items');

proc.kill();
console.log('MCP contract test passed.');