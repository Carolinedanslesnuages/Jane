const LAST_USER_KEY = 'jane.lastUserId';

/** Remembers the signed-in account, so that the offline data of that account can be found at startup. */
export function rememberUser(userId: string): void {
  try {
    localStorage.setItem(LAST_USER_KEY, userId);
  } catch {
    // Without storage nothing can survive a reload anyway.
  }
}

export function recallUser(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

export function forgetUser(): void {
  try {
    localStorage.removeItem(LAST_USER_KEY);
  } catch {
    // Nothing to forget.
  }
}
