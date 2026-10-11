/** Opens the existing login dialog without navigating away from the current search. */
export const LOGIN_DIALOG_EVENT = 'dining:open-login';
export function openLoginDialog() { window.dispatchEvent(new Event(LOGIN_DIALOG_EVENT)); }
