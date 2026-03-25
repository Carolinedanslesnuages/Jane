export type StartupMode = 'online' | 'offline' | 'blocked';

/**
 * How the application starts:
 * - online: Keycloak answers, the normal sign-in takes place;
 * - offline: Keycloak cannot be reached but this device already knows an account, so Jane opens with its local data;
 * - blocked: no network and no known account: nothing to show yet, a first sign-in needs the network.
 */
export function decideStartup(keycloakReachable: boolean, rememberedUserId: string | null): StartupMode {
  if (keycloakReachable) {
    return 'online';
  }
  return rememberedUserId ? 'offline' : 'blocked';
}

/** Whether the identity server answers within a few seconds. An opaque answer is enough: only reachability matters. */
export async function isReachable(url: string, timeoutMs = 3000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
