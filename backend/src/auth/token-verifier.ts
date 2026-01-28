import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';

export interface VerifiedToken {
  subject: string;
  email?: string;
  displayName?: string;
}

export interface TokenVerifierOptions {
  issuer: string;
  audience: string;
  keyResolver: JWTVerifyGetKey;
}

/** Verifies access tokens issued by Keycloak (signature, issuer, audience, expiry). */
export class TokenVerifier {
  constructor(private readonly options: TokenVerifierOptions) {}

  /** Builds a verifier that fetches and caches the realm signing keys from Keycloak. */
  static forRealm(keycloakUrl: string, realm: string, audience: string): TokenVerifier {
    const issuer = `${keycloakUrl}/realms/${realm}`;
    return new TokenVerifier({
      issuer,
      audience,
      keyResolver: createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`)),
    });
  }

  async verify(token: string): Promise<VerifiedToken> {
    const { payload } = await jwtVerify(token, this.options.keyResolver, {
      issuer: this.options.issuer,
      audience: this.options.audience,
    });
    if (!payload.sub) {
      throw new Error('Jeton sans identifiant utilisateur (sub)');
    }
    return {
      subject: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      displayName: typeof payload.name === 'string' ? payload.name : undefined,
    };
  }
}
