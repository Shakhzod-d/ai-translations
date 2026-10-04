import { handleGeminiProxy, isSameOrigin } from '../../server/gemini-proxy';

/** Vercel Function: POST /api/ai/gemini. Set GEMINI_API_KEY in the Vercel project settings. */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 403 });
  }
  const body: unknown = await request.json().catch(() => null);
  const result = await handleGeminiProxy(body, process.env.GEMINI_API_KEY);
  return Response.json(result.body, { status: result.status });
}
