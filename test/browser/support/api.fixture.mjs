import { expect, test as base } from '@playwright/test';

export const appOrigin = 'http://127.0.0.1:3100';
const apiOrigin = 'http://127.0.0.1:5000';

export const test = base.extend({
  api: async ({ context }, provideApi) => {
    const handlers = new Map();
    const calls = [];
    const unexpected = [];
    // Every browser request is confined to the local Next app or an explicitly
    // mocked local API route. No real OAuth/payment/banking network access.
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === appOrigin) return route.continue();
      if (url.origin !== apiOrigin) return route.abort();
      const headers = {
        'access-control-allow-origin': appOrigin,
        'access-control-allow-credentials': 'true',
        'access-control-expose-headers': 'Retry-After',
        'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization, x-csrf-token, accept',
      };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const call = {
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        method: request.method(),
        body: request.postData() ? request.postDataJSON() : null,
        headers: request.headers(),
      };
      calls.push(call);
      const handler = handlers.get(call.method + ' ' + call.path);
      if (!handler) {
        unexpected.push(call.method + ' ' + call.path);

        return route.fulfill({ status: 500, headers, json: { success: false } });
      }
      const result = await handler(call);

      return route.fulfill({ status: result.status ?? 200, headers: { ...headers, ...result.headers }, json: result.json });
    });
    await provideApi({
      calls,
      respond(method, path, handler) {
        handlers.set(method + ' ' + path, handler);
      },
    });

    expect(unexpected, 'Unexpected local API requests').toEqual([]);
  },
});

export { expect };
export const success = (data) => ({ status: 200, json: { statusCode: 200, success: true, data } });
