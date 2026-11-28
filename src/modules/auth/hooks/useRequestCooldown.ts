'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { type CooldownScope, getRequestCooldownSeconds, subscribeToRequestCooldown } from '../helpers/requestCooldown';

function getServerSnapshot(): number {
  return 0;
}

export function useRequestCooldown(scope: CooldownScope): number {
  const subscribe = useCallback((onChange: () => void) => subscribeToRequestCooldown(scope, onChange), [scope]);
  const getSnapshot = useCallback(() => getRequestCooldownSeconds(scope), [scope]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
