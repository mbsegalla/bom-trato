export function getApiConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL_API;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL_API is required.');
  }

  const url = new URL(baseUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_BASE_URL_API must use HTTP or HTTPS.');
  }

  return {
    baseUrl: url.origin,
    timeoutMs: 15000,
  };
}
