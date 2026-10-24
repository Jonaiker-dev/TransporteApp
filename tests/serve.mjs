import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const root = path.resolve('dist/pwa');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};
http
  .createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!target.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end();
        return;
      }
      const raw = await readFile(target);
      const compress =
        /\.(html|js|css|json|svg)$/.test(target) &&
        request.headers['accept-encoding']?.includes('gzip');
      const data = compress ? gzipSync(raw) : raw;
      response.writeHead(200, {
        'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
        ...(compress ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
      });
      response.end(data);
    } catch {
      response.writeHead(404).end('Not found');
    }
  })
  .listen(4173, '127.0.0.1');
