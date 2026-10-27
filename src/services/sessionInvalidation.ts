type SessionInvalidatedHandler = () => void | Promise<void>;

let handler: SessionInvalidatedHandler | null = null;
let invalidationInProgress = false;

export function setSessionInvalidatedHandler(fn: SessionInvalidatedHandler | null) {
  handler = fn;
}

export function isSessionInvalidationInProgress() {
  return invalidationInProgress;
}

export function resetSessionInvalidationFlag() {
  invalidationInProgress = false;
}

export function notifySessionInvalidated() {
  if (invalidationInProgress) return;
  invalidationInProgress = true;
  try {
    void Promise.resolve(handler?.()).finally(() => {
      invalidationInProgress = false;
    });
  } catch {
    invalidationInProgress = false;
  }
}
