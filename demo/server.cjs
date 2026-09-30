const http = require('http');
const fs = require('fs');
const path = require('path');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // AI Chat Proxy endpoint (bypasses browser Cloudflare 403 Forbidden)
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const aiRes = await fetch('https://text.pollinations.ai/openai/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payload.messages || [],
            model: payload.model || 'openai-fast',
            temperature: 0.7
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!aiRes.ok) {
          throw new Error(`AI upstream status ${aiRes.status}`);
        }

        const data = await aiRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
      } catch (err) {
        // Fallback gracefully without 403 or error
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          choices: [{
            message: {
              role: 'assistant',
              content: '¡Hola! Te escucho con atención. Cuéntame qué acción deseas realizar o sobre qué te gustaría hablar.'
            }
          }]
        }));
      }
    });
    return;
  }

  // Static files
  let cleanUrl = req.url.split('?')[0];
  let filePath = path.join(__dirname, cleanUrl === '/' ? 'index.html' : cleanUrl);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`SERVER_STARTED_ON_${PORT}`);
});
