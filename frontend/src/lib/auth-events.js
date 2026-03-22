const AUTH_INVALIDATED_EVENT = "temnaarea:auth-invalidated";

export function emitAuthInvalidated(detail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_INVALIDATED_EVENT, { detail }));
}

export function subscribeAuthInvalidated(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event) => handler(event.detail || {});
  window.addEventListener(AUTH_INVALIDATED_EVENT, listener);
  return () => window.removeEventListener(AUTH_INVALIDATED_EVENT, listener);
}
