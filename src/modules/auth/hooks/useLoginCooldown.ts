'use client';

import { useSyncExternalStore } from 'react';

import { getRequestCooldownSeconds, subscribeToRequestCooldown } from '../helpers/requestCooldown';

function getSnapshot(): number {
  return getRequestCooldownSeconds('login');
}

function getServerSnapshot(): number {
  return 0;
}

function subscribe(onChange: () => void): () => void {
  return subscribeToRequestCooldown('login', onChange);
}

export function useLoginCooldown(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
