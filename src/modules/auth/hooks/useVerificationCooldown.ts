'use client';

import { useSyncExternalStore } from 'react';

import { getVerificationCooldownSeconds, subscribeToVerificationCooldown } from '../helpers/verificationCooldown';

function getServerSnapshot(): number {
  return 0;
}

export function useVerificationCooldown(): number {
  return useSyncExternalStore(subscribeToVerificationCooldown, getVerificationCooldownSeconds, getServerSnapshot);
}
