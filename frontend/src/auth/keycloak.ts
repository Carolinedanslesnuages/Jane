import Keycloak from 'keycloak-js';

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

/** Signs the visitor in (authorization code flow with PKCE); redirects to Keycloak when needed. */
export async function initializeAuthentication(): Promise<boolean> {
  return keycloak.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });
}

/** A valid access token, refreshed when it expires within the next 30 seconds. */
export async function getAccessToken(): Promise<string> {
  await keycloak.updateToken(30);
  if (!keycloak.token) {
    throw new Error('Aucun jeton d\'accès : la session a expiré');
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
