import { getRequestCooldownSeconds, startRequestCooldown, subscribeToRequestCooldown } from './requestCooldown';

export const VERIFICATION_COOLDOWN_SECONDS = 180;

export function getVerificationCooldownSeconds(): number {
  return getRequestCooldownSeconds('verification');
}

export function startVerificationCooldown(seconds = VERIFICATION_COOLDOWN_SECONDS): void {
  startRequestCooldown('verification', seconds);
}

export function subscribeToVerificationCooldown(onChange: () => void): () => void {
  return subscribeToRequestCooldown('verification', onChange);
}
