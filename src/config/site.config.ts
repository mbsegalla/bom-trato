const DEVELOPMENT_SITE_URL = 'http://localhost:3000';

function resolveSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SITE_URL is required in production.');
    }

    return new URL(DEVELOPMENT_SITE_URL);
  }

  const url = new URL(configuredUrl);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.');
  }

  return new URL(url.origin);
}

export const siteConfig = {
  name: 'Bom Trato',
  description:
    'Conecte clientes, orçamentos, ordens de serviço, agenda e recebimentos em um único fluxo com o Bom Trato.',
  url: resolveSiteUrl(),
  locale: 'pt_BR',
  language: 'pt-BR',
};
