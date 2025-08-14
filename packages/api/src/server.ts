import http from 'node:http';

const port = Number(process.env.PORT || 3000);

const server = http.createServer((_req, res) => {
  if (_req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(port, () => {
  console.log(`[api] listening on :${port}`);
});