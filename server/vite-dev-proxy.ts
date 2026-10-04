import type { Plugin } from 'vite';
import { handleGeminiProxy } from './gemini-proxy';

/** Serves /api/ai/gemini during `npm run dev`, mirroring the Vercel Function. */
export const geminiDevProxy = (apiKey: string | undefined): Plugin => ({
  name: 'gemini-dev-proxy',
  configureServer(server) {
    server.middlewares.use('/api/ai/gemini', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end();
        return;
      }
      let raw = '';
      req.on('data', (chunk: Buffer) => (raw += chunk.toString()));
      req.on('end', async () => {
        let body: unknown = null;
        try {
          body = JSON.parse(raw);
        } catch {
          // handled as VALIDATION below
        }
        const result = await handleGeminiProxy(body, apiKey);
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result.body));
      });
    });
  },
});
