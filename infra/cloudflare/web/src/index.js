/**
 * Bearerchum edge Worker (bearerchum.necookie.dev).
 *
 * - Static site (React build + content bundle + PDF) is served from Workers static assets, with
 *   SPA fallback to index.html for client-side routes.
 * - /api/* is forwarded privately to the FastAPI container on necore through a Workers VPC service
 *   bound to Bearerchum's own tunnel (the backend is never published on the internet).
 *   Until the VPC binding exists, /api returns a clear 503 and the site works in guest mode.
 */

const HOP_BY_HOP = ['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer'];

function json(status, detail) {
  return new Response(JSON.stringify({ detail }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function forwardApi(request, env, url) {
  if (!env.API) return json(503, 'Team server not connected yet — progress is saved in this browser.');
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const clientIp = request.headers.get('cf-connecting-ip') ?? '';
  const headers = new Headers(request.headers);
  for (const h of HOP_BY_HOP) headers.delete(h);
  // Overwrite (never append) client-identifying headers so they cannot be spoofed.
  headers.set('x-forwarded-for', clientIp);
  headers.set('cf-connecting-ip', clientIp);
  headers.set('x-forwarded-proto', 'https');
  headers.set('x-forwarded-host', url.host);
  headers.set('x-request-id', requestId);
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  try {
    // Routing is decided by the VPC service (bearerchum-web:8000); the URL host only sets Host.
    const upstream = await env.API.fetch(`http://bearerchum-web${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'manual',
    });
    const res = new Response(upstream.body, upstream);
    res.headers.set('cache-control', 'no-store');
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    console.error('upstream unreachable', { requestId, message: err instanceof Error ? err.message : String(err) });
    return json(502, 'Team server is temporarily unreachable — progress is saved in this browser.');
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith('/api/')) return forwardApi(request, env, url);
    return env.ASSETS.fetch(request);
  },
};
