type SessionInvalidatedHandler = () => void | Promise<void>;

let handler: SessionInvalidatedHandler | null = null;

export function setSessionInvalidatedHandler(fn: SessionInvalidatedHandler | null) {
  handler = fn;
}

export function notifySessionInvalidated() {
  try {
    void Promise.resolve(handler?.());
  } catch {
    /* noop */
  }
}
