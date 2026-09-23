const STORAGE_PREFIX = 'bom-trato';
const DEFAULT_COOLDOWN_SECONDS = 180;

export type CooldownScope = 'verification' | 'password-reset';

const memoryUntil: Record<CooldownScope, number> = {
  verification: 0,
  'password-reset': 0,
};

function getStorageKey(scope: CooldownScope): string {
  return `${STORAGE_PREFIX}:${scope}-cooldown-until`;
}

function getChangeEvent(scope: CooldownScope): string {
  return `${STORAGE_PREFIX}:${scope}-cooldown-change`;
}

function getCooldownUntil(scope: CooldownScope): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const stored = Number(window.localStorage.getItem(getStorageKey(scope)));

    if (Number.isSafeInteger(stored) && stored > 0) {
      memoryUntil[scope] = Math.max(memoryUntil[scope], stored);
    }
  } catch {
    console.error(`Failed to read ${scope} cooldown from localStorage`);
  }

  return memoryUntil[scope];
}

export function getRequestCooldownSeconds(scope: CooldownScope): number {
  return Math.max(0, Math.ceil((getCooldownUntil(scope) - Date.now()) / 1000));
}

export function startRequestCooldown(scope: CooldownScope, seconds = DEFAULT_COOLDOWN_SECONDS): void {
  if (typeof window === 'undefined' || !Number.isFinite(seconds) || seconds <= 0) {
    return;
  }

  memoryUntil[scope] = Math.max(getCooldownUntil(scope), Date.now() + Math.ceil(seconds) * 1000);

  try {
    window.localStorage.setItem(getStorageKey(scope), String(memoryUntil[scope]));
  } catch {
    console.error(`Failed to write ${scope} cooldown to localStorage`);
  }

  window.dispatchEvent(new Event(getChangeEvent(scope)));
}

export function subscribeToRequestCooldown(scope: CooldownScope, onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 1000);

  const onStorage = (event: StorageEvent) => {
    if (event.key === getStorageKey(scope) || event.key === null) {
      onChange();
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(getChangeEvent(scope), onChange);
  window.addEventListener('focus', onChange);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(getChangeEvent(scope), onChange);
    window.removeEventListener('focus', onChange);
  };
}

export function readRetryAfterSeconds(response: Response, fallbackSeconds = DEFAULT_COOLDOWN_SECONDS): number {
  const value = response.headers.get('Retry-After');

  if (!value) {
    return fallbackSeconds;
  }

  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - Date.now()) / 1000);

  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : fallbackSeconds;
}
