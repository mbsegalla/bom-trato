'use client';

import { useSyncExternalStore } from 'react';

import { getPasswordResetCooldownSeconds, subscribeToPasswordResetCooldown } from '../helpers/passwordResetCooldown';

function getServerSnapshot(): number {
  return 0;
}

export function usePasswordResetCooldown(): number {
  return useSyncExternalStore(subscribeToPasswordResetCooldown, getPasswordResetCooldownSeconds, getServerSnapshot);
}
