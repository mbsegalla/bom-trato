import type { TestContext } from 'node:test';

export const organizationId = '11111111-1111-4111-8111-111111111111';
export const receivableId = '22222222-2222-4222-8222-222222222222';
export const issuanceId = '33333333-3333-4333-8333-333333333333';

export function success(data: unknown): Response {
  return Response.json({ statusCode: 200, success: true, data });
}

export function sessionResponse(accessToken = 'fixture-access'): Response {
  return success({
    accessToken,
    expiresIn: 3600,
    tokenType: 'Bearer',
    csrfToken: 'fixture-csrf',
  });
}

export interface HttpCall {
  path: string;
  method: string;
  headers: Headers;
  body: BodyInit | null | undefined;
  credentials: RequestCredentials | undefined;
  cache: RequestCache | undefined;
}

export function mockHttp(t: TestContext, handler: (call: HttpCall) => Response | Promise<Response>) {
  const calls: HttpCall[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.origin !== 'https://api.example.invalid') throw new Error('Unexpected API origin');
    const call: HttpCall = {
      path: url.pathname + url.search,
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: init?.body,
      credentials: init?.credentials,
      cache: init?.cache,
    };
    calls.push(call);

    return handler(call);
  });

  return calls;
}
