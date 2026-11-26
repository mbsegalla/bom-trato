import type { TestContext } from 'node:test';

// Minimal browser boundary for storage and event-based helpers. Restore
// the original global after each test; no DOM or external browser required.
export function installBrowserStorage(t: TestContext) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const data = new Map<string, string>();
  const events = new EventTarget();
  const localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
  const windowFixture = {
    localStorage,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: windowFixture });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  });
  return windowFixture;
}
