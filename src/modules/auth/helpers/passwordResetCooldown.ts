import { getRequestCooldownSeconds, startRequestCooldown, subscribeToRequestCooldown } from './requestCooldown';

export const PASSWORD_RESET_COOLDOWN_SECONDS = 180;

export function getPasswordResetCooldownSeconds(): number {
  return getRequestCooldownSeconds('password-reset');
}

export function startPasswordResetCooldown(seconds = PASSWORD_RESET_COOLDOWN_SECONDS): void {
  startRequestCooldown('password-reset', seconds);
}

export function subscribeToPasswordResetCooldown(onChange: () => void): () => void {
  return subscribeToRequestCooldown('password-reset', onChange);
}
