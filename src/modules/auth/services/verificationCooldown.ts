const STORAGE_KEY = 'bom-trato:verification-cooldown-until';
const CHANGE_EVENT = 'bom-trato:verification-cooldown-change';

export const VERIFICATION_COOLDOWN_SECONDS = 60;

let memoryUntil = 0;

function getCooldownUntil(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));

    if (Number.isSafeInteger(stored) && stored > 0) {
      memoryUntil = Math.max(memoryUntil, stored);
    }
  } catch {
    // Storage can be disabled. The API remains responsible for enforcement.
  }

  return memoryUntil;
}

export function getVerificationCooldownSeconds(): number {
  return Math.max(0, Math.ceil((getCooldownUntil() - Date.now()) / 1000));
}

export function startVerificationCooldown(seconds = VERIFICATION_COOLDOWN_SECONDS): void {
  if (typeof window === 'undefined' || !Number.isFinite(seconds) || seconds <= 0) {
    return;
  }

  memoryUntil = Math.max(getCooldownUntil(), Date.now() + Math.ceil(seconds) * 1000);

  try {
    // Only a timestamp: no email, token, or other account information.
    window.localStorage.setItem(STORAGE_KEY, String(memoryUntil));
  } catch {
    // Continue with the in-memory deadline when storage is unavailable.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToVerificationCooldown(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 1000);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      onChange();
    }
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('focus', onChange);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('focus', onChange);
  };
}

export function readRetryAfterSeconds(response: Response): number {
  const value = response.headers.get('Retry-After');

  if (!value) {
    return VERIFICATION_COOLDOWN_SECONDS;
  }

  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - Date.now()) / 1000);

  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : VERIFICATION_COOLDOWN_SECONDS;
}
