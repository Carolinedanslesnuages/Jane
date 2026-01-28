import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet, JWK } from 'jose';
import { TokenVerifier } from './token-verifier';

const ISSUER = 'http://localhost:8180/realms/jane';
const AUDIENCE = 'jane-api';

async function createFixture() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };
  const verifier = new TokenVerifier({
    issuer: ISSUER,
    audience: AUDIENCE,
    keyResolver: createLocalJWKSet({ keys: [jwk] }),
  });
  const sign = (claims: Record<string, unknown>, options: { issuer?: string; audience?: string; expiresIn?: string } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setSubject('user-1')
      .setIssuer(options.issuer ?? ISSUER)
      .setAudience(options.audience ?? AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(options.expiresIn ?? '5m')
      .sign(privateKey);
  return { verifier, sign };
}

describe('TokenVerifier', () => {
  it('accepts a valid token and extracts the identity', async () => {
    const { verifier, sign } = await createFixture();
    const token = await sign({ email: 'demo@jane.test', name: 'Démo Jane' });
    await expect(verifier.verify(token)).resolves.toEqual({
      subject: 'user-1',
      email: 'demo@jane.test',
      displayName: 'Démo Jane',
    });
  });

  it('rejects a token for another audience', async () => {
    const { verifier, sign } = await createFixture();
    await expect(verifier.verify(await sign({}, { audience: 'account' }))).rejects.toThrow();
  });

  it('rejects a token from another issuer', async () => {
    const { verifier, sign } = await createFixture();
    await expect(verifier.verify(await sign({}, { issuer: 'http://evil.test/realms/jane' }))).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const { verifier, sign } = await createFixture();
    await expect(verifier.verify(await sign({}, { expiresIn: '-1m' }))).rejects.toThrow();
  });

  it('rejects a token signed with an unknown key', async () => {
    const { verifier } = await createFixture();
    const other = await generateKeyPair('RS256');
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setSubject('user-1')
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime('5m')
      .sign(other.privateKey);
    await expect(verifier.verify(forged)).rejects.toThrow();
  });
});
