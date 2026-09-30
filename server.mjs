import http from 'node:http';
import { extname, normalize } from 'node:path';
import { readFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    const requested = normalize(pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
    const file = new URL(requested, root);
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(requested)] || 'text/plain; charset=utf-8' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(4173, '127.0.0.1', () => {
  console.log('BUSHO demo on http://127.0.0.1:4173');
});
