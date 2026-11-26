export const dynamic = 'force-dynamic';

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const valid =
    !url.searchParams.has('error') &&
    url.searchParams.getAll('code').length === 1 &&
    url.searchParams.getAll('state').length === 1 &&
    /^[\x21-\x7E]{1,2048}$/.test(code) &&
    /^[A-Za-z0-9_-]{43}$/.test(state);

  const fragment = new URLSearchParams(valid ? { code, state } : { error: 'authorization' });

  // Move the temporary grant out of the query string before rendering any page.
  return new Response(null, {
    status: 303,
    headers: {
      Location: `/mercado-pago/conectar#${fragment.toString()}`,
      'Cache-Control': 'private, no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  });
}
