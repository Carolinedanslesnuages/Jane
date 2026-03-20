import Keycloak from 'keycloak-js';
import { NetworkError } from '../offline/outbox';
import { recallUser, rememberUser } from '../offline/user';

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

/** Signs the visitor in (authorization code flow with PKCE); redirects to Keycloak when needed. */
export async function initializeAuthentication(): Promise<boolean> {
  const authenticated = await keycloak.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });
  if (authenticated && keycloak.subject) {
    rememberUser(keycloak.subject);
  }
  return authenticated;
}

/**
 * The sign-in identity (Keycloak "sub") whose data this device holds: the signed-in one, or the last one seen
 * when the application starts without network. Offline copies and the outbox are filed under it.
 */
export function currentSubject(): string | null {
  return keycloak.subject ?? recallUser();
}

/**
 * A valid access token, refreshed when it expires within the next 30 seconds.
 * Without network the refresh cannot happen: that is reported as a NetworkError (the caller can wait).
 * When the network works but the session is over, the visitor is sent back to the login page.
 */
export async function getAccessToken(): Promise<string> {
  try {
    await keycloak.updateToken(30);
  } catch {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new NetworkError('Session indisponible hors ligne');
    }
    await keycloak.login();
    throw new NetworkError('Session expirée : reconnexion en cours');
  }
  if (!keycloak.token) {
    throw new NetworkError("Aucun jeton d'accès");
  }
  return keycloak.token;
}

export function signOut(): Promise<void> {
  return keycloak.logout({ redirectUri: window.location.origin });
}

export interface SessionProfile {
  displayName: string;
  email: string;
}

export function readProfile(): SessionProfile {
  const claims = keycloak.tokenParsed ?? {};
  return {
    displayName: String(claims.name ?? claims.preferred_username ?? ''),
    email: String(claims.email ?? ''),
  };
}
