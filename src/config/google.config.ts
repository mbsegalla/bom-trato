export function getGoogleConfig() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is required.');
  }

  if (!clientId.endsWith('.apps.googleusercontent.com')) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is invalid.');
  }

  return {
    clientId,
  };
}
